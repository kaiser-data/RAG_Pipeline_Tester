"""
Vector Store Module
Provides abstract interface and implementations for ChromaDB and FAISS
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import numpy as np
import chromadb
from chromadb.config import Settings
import faiss
import json
import os
from pathlib import Path


class VectorStore(ABC):
    """Abstract base class for vector storage backends"""

    @abstractmethod
    def add_vectors(
        self,
        vectors: List[List[float]],
        metadata: List[Dict[str, Any]],
        collection_name: str = "default"
    ) -> Dict[str, Any]:
        """
        Add vectors with metadata to collection

        Args:
            vectors: List of embedding vectors
            metadata: List of metadata dicts (must include 'id' and 'text')
            collection_name: Name of the collection

        Returns:
            Status dict with added count
        """
        pass

    @abstractmethod
    def search(
        self,
        query_vector: List[float],
        top_k: int = 5,
        collection_name: str = "default"
    ) -> List[Dict[str, Any]]:
        """
        Search for similar vectors

        Args:
            query_vector: Query embedding vector
            top_k: Number of results to return
            collection_name: Name of the collection

        Returns:
            List of results with id, text, score, and metadata
        """
        pass

    @abstractmethod
    def list_collections(self) -> List[str]:
        """List all available collections"""
        pass

    @abstractmethod
    def delete_collection(self, collection_name: str) -> bool:
        """Delete a collection"""
        pass

    @abstractmethod
    def get_stats(self, collection_name: str) -> Dict[str, Any]:
        """Get collection statistics"""
        pass


class ChromaDBStore(VectorStore):
    """ChromaDB implementation with persistent storage"""

    def __init__(self, persist_directory: str = "./chroma_db"):
        """Initialize ChromaDB with persistent storage"""
        self.persist_directory = persist_directory
        Path(persist_directory).mkdir(parents=True, exist_ok=True)

        self.client = chromadb.PersistentClient(
            path=persist_directory,
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )

    def add_vectors(
        self,
        vectors: List[List[float]],
        metadata: List[Dict[str, Any]],
        collection_name: str = "default"
    ) -> Dict[str, Any]:
        """Add vectors to ChromaDB collection"""
        collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={"description": "RAG embeddings"}
        )

        # Extract IDs and documents from metadata
        ids = [m["id"] for m in metadata]
        documents = [m.get("text", "") for m in metadata]

        # Remove 'id' and 'text' from metadata to avoid duplication
        clean_metadata = [
            {k: v for k, v in m.items() if k not in ["id", "text"]}
            for m in metadata
        ]

        # Add to collection
        collection.add(
            ids=ids,
            embeddings=vectors,
            documents=documents,
            metadatas=clean_metadata
        )

        return {
            "status": "success",
            "added_count": len(vectors),
            "collection": collection_name,
            "backend": "chromadb"
        }

    def search(
        self,
        query_vector: List[float],
        top_k: int = 5,
        collection_name: str = "default"
    ) -> List[Dict[str, Any]]:
        """Search ChromaDB collection"""
        try:
            collection = self.client.get_collection(name=collection_name)
        except Exception:
            return []

        results = collection.query(
            query_embeddings=[query_vector],
            n_results=top_k,
            include=["documents", "metadatas", "distances"]
        )

        # Format results
        formatted_results = []
        for i in range(len(results["ids"][0])):
            formatted_results.append({
                "id": results["ids"][0][i],
                "text": results["documents"][0][i],
                "score": float(1 - results["distances"][0][i]),  # Convert distance to similarity
                "metadata": results["metadatas"][0][i]
            })

        return formatted_results

    def list_collections(self) -> List[str]:
        """List all ChromaDB collections"""
        try:
            collections = self.client.list_collections()
            # Handle different ChromaDB versions - collections might be dicts or objects
            result = []
            for c in collections:
                if isinstance(c, dict):
                    result.append(c.get('name', str(c)))
                elif hasattr(c, 'name'):
                    result.append(c.name)
                else:
                    # Fallback: convert to string
                    result.append(str(c))
            return result
        except Exception as e:
            # Log error and return empty list
            print(f"Error listing ChromaDB collections: {e}")
            return []

    def delete_collection(self, collection_name: str) -> bool:
        """Delete ChromaDB collection"""
        try:
            self.client.delete_collection(name=collection_name)
            return True
        except Exception:
            return False

    def get_stats(self, collection_name: str) -> Dict[str, Any]:
        """Get ChromaDB collection statistics"""
        try:
            collection = self.client.get_collection(name=collection_name)
            count = collection.count()
            return {
                "collection": collection_name,
                "vector_count": count,
                "backend": "chromadb",
                "persistent": True
            }
        except Exception:
            return {
                "collection": collection_name,
                "vector_count": 0,
                "backend": "chromadb",
                "error": "Collection not found"
            }


class FAISSStore(VectorStore):
    """FAISS implementation with save/load functionality"""

    def __init__(self, index_directory: str = "./faiss_indexes"):
        """Initialize FAISS store"""
        self.index_directory = index_directory
        Path(index_directory).mkdir(parents=True, exist_ok=True)

        # In-memory storage for indexes and metadata
        self.indexes: Dict[str, faiss.Index] = {}
        self.metadata_store: Dict[str, List[Dict[str, Any]]] = {}
        self.dimension: Dict[str, int] = {}

        # Load existing indexes
        self._load_all_indexes()

    def _get_index_path(self, collection_name: str) -> str:
        """Get file path for index"""
        return os.path.join(self.index_directory, f"{collection_name}.index")

    def _get_metadata_path(self, collection_name: str) -> str:
        """Get file path for metadata"""
        return os.path.join(self.index_directory, f"{collection_name}.json")

    def _load_all_indexes(self):
        """Load all existing indexes from disk"""
        if not os.path.exists(self.index_directory):
            return

        for filename in os.listdir(self.index_directory):
            if filename.endswith(".index"):
                collection_name = filename[:-6]  # Remove .index
                try:
                    self._load_index(collection_name)
                except Exception as e:
                    print(f"Failed to load index {collection_name}: {e}")

    def _load_index(self, collection_name: str):
        """Load index and metadata from disk"""
        index_path = self._get_index_path(collection_name)
        metadata_path = self._get_metadata_path(collection_name)

        if os.path.exists(index_path):
            self.indexes[collection_name] = faiss.read_index(index_path)
            self.dimension[collection_name] = self.indexes[collection_name].d

        if os.path.exists(metadata_path):
            with open(metadata_path, 'r') as f:
                self.metadata_store[collection_name] = json.load(f)

    def _save_index(self, collection_name: str):
        """Save index and metadata to disk"""
        index_path = self._get_index_path(collection_name)
        metadata_path = self._get_metadata_path(collection_name)

        if collection_name in self.indexes:
            faiss.write_index(self.indexes[collection_name], index_path)

        if collection_name in self.metadata_store:
            with open(metadata_path, 'w') as f:
                json.dump(self.metadata_store[collection_name], f)

    def add_vectors(
        self,
        vectors: List[List[float]],
        metadata: List[Dict[str, Any]],
        collection_name: str = "default"
    ) -> Dict[str, Any]:
        """Add vectors to FAISS index"""
        vectors_array = np.array(vectors, dtype=np.float32)
        dimension = vectors_array.shape[1]

        # Create index if it doesn't exist
        if collection_name not in self.indexes:
            # Use IndexFlatIP for inner product (cosine similarity with normalized vectors)
            self.indexes[collection_name] = faiss.IndexFlatIP(dimension)
            self.metadata_store[collection_name] = []
            self.dimension[collection_name] = dimension

        # Normalize vectors for cosine similarity
        faiss.normalize_L2(vectors_array)

        # Add to index
        self.indexes[collection_name].add(vectors_array)
        self.metadata_store[collection_name].extend(metadata)

        # Save to disk
        self._save_index(collection_name)

        return {
            "status": "success",
            "added_count": len(vectors),
            "collection": collection_name,
            "backend": "faiss"
        }

    def search(
        self,
        query_vector: List[float],
        top_k: int = 5,
        collection_name: str = "default"
    ) -> List[Dict[str, Any]]:
        """Search FAISS index"""
        if collection_name not in self.indexes:
            return []

        query_array = np.array([query_vector], dtype=np.float32)
        faiss.normalize_L2(query_array)

        # Search
        scores, indices = self.indexes[collection_name].search(query_array, top_k)

        # Format results
        results = []
        for i, (score, idx) in enumerate(zip(scores[0], indices[0])):
            if idx < len(self.metadata_store[collection_name]):
                meta = self.metadata_store[collection_name][idx]
                results.append({
                    "id": meta.get("id", f"vector_{idx}"),
                    "text": meta.get("text", ""),
                    "score": float(score),  # Already normalized similarity
                    "metadata": {k: v for k, v in meta.items() if k not in ["id", "text"]}
                })

        return results

    def list_collections(self) -> List[str]:
        """List all FAISS collections"""
        return list(self.indexes.keys())

    def delete_collection(self, collection_name: str) -> bool:
        """Delete FAISS collection"""
        try:
            # Remove from memory
            if collection_name in self.indexes:
                del self.indexes[collection_name]
            if collection_name in self.metadata_store:
                del self.metadata_store[collection_name]
            if collection_name in self.dimension:
                del self.dimension[collection_name]

            # Remove from disk
            index_path = self._get_index_path(collection_name)
            metadata_path = self._get_metadata_path(collection_name)

            if os.path.exists(index_path):
                os.remove(index_path)
            if os.path.exists(metadata_path):
                os.remove(metadata_path)

            return True
        except Exception:
            return False

    def get_stats(self, collection_name: str) -> Dict[str, Any]:
        """Get FAISS collection statistics"""
        if collection_name in self.indexes:
            return {
                "collection": collection_name,
                "vector_count": self.indexes[collection_name].ntotal,
                "dimension": self.dimension[collection_name],
                "backend": "faiss",
                "persistent": True
            }
        return {
            "collection": collection_name,
            "vector_count": 0,
            "backend": "faiss",
            "error": "Collection not found"
        }


class VectorStoreManager:
    """
    Manager class for vector stores with embedding generation
    Provides unified interface for RAG engine
    """

    def __init__(self, vector_stores: Dict[str, VectorStore]):
        """
        Initialize manager with vector store backends

        Args:
            vector_stores: Dictionary mapping backend names to VectorStore instances
                          e.g., {"chromadb": ChromaDBStore(), "faiss": FAISSStore()}
        """
        self.vector_stores = vector_stores
        self.embedder = None

    def _get_embedder(self):
        """Lazy load embedder for query embedding generation"""
        if self.embedder is None:
            from app.embedder import embedder
            self.embedder = embedder
        return self.embedder

    def search(
        self,
        query_text: str,
        collection_name: str,
        backend: str = "chromadb",
        top_k: int = 5,
        model_name: str = "all-MiniLM-L6-v2"
    ) -> List[Dict[str, Any]]:
        """
        Search for similar documents using text query

        Args:
            query_text: Text query to search for
            collection_name: Name of the collection to search
            backend: Backend to use ("chromadb" or "faiss")
            top_k: Number of results to return
            model_name: Sentence transformer model for embedding

        Returns:
            List of search results with text, metadata, and scores
        """
        # Validate backend
        if backend not in self.vector_stores:
            raise ValueError(
                f"Unknown backend: {backend}. "
                f"Available: {list(self.vector_stores.keys())}"
            )

        # Generate query embedding
        embedder = self._get_embedder()
        embedder._load_sentence_transformer(model_name)

        # Create dummy chunk for embedding generation
        query_chunk = [{"text": query_text, "chunk_id": "query", "document_id": "query"}]
        query_embeddings = embedder.generate_sentence_transformer_embeddings(
            query_chunk,
            model_name=model_name,
            batch_size=1
        )

        if not query_embeddings:
            return []

        query_vector = query_embeddings[0]["embedding_vector"]

        # Search vector store
        vector_store = self.vector_stores[backend]
        results = vector_store.search(
            query_vector=query_vector,
            top_k=top_k,
            collection_name=collection_name
        )

        return results

    def list_collections(self, backend: str = "chromadb") -> List[str]:
        """List all collections in specified backend"""
        if backend not in self.vector_stores:
            raise ValueError(f"Unknown backend: {backend}")
        return self.vector_stores[backend].list_collections()

    def get_stats(self, collection_name: str, backend: str = "chromadb") -> Dict[str, Any]:
        """Get collection statistics from specified backend"""
        if backend not in self.vector_stores:
            raise ValueError(f"Unknown backend: {backend}")
        return self.vector_stores[backend].get_stats(collection_name)


# Factory function for easy initialization
def create_vector_store(backend: str = "chromadb", **kwargs) -> VectorStore:
    """
    Factory function to create vector store

    Args:
        backend: "chromadb" or "faiss"
        **kwargs: Additional arguments for store initialization

    Returns:
        VectorStore instance
    """
    if backend.lower() == "chromadb":
        return ChromaDBStore(**kwargs)
    elif backend.lower() == "faiss":
        return FAISSStore(**kwargs)
    else:
        raise ValueError(f"Unknown backend: {backend}. Choose 'chromadb' or 'faiss'")
