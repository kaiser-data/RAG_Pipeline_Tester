"""
In-memory storage for documents, chunks, and embeddings
This keeps things simple for Phase 1-4, can be replaced with a database later
"""

from typing import Dict, List, Optional, Any
from datetime import datetime
import uuid


class InMemoryStorage:
    """Simple in-memory storage using Python dictionaries"""

    def __init__(self):
        self.documents: Dict[str, Dict[str, Any]] = {}
        self.chunks: Dict[str, List[Dict[str, Any]]] = {}  # document_id -> chunks
        self.embeddings: Dict[str, Any] = {}  # document_id -> embeddings data
        self.configurations: Dict[str, Dict[str, Any]] = {}  # saved pipeline configs
        self.query_history: List[Dict[str, Any]] = []

    # Document operations
    def create_document(self, filename: str, file_path: str, file_size: int, file_type: str) -> str:
        """Create a new document entry"""
        doc_id = str(uuid.uuid4())
        self.documents[doc_id] = {
            "id": doc_id,
            "filename": filename,
            "file_path": file_path,
            "file_size": file_size,
            "file_type": file_type,
            "upload_timestamp": datetime.now(),
            "status": "processing",
            "text": None,
            "char_count": None,
            "word_count": None,
            "estimated_tokens": None,
            "error_message": None
        }
        return doc_id

    def get_document(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """Get document by ID"""
        return self.documents.get(doc_id)

    def get_all_documents(self) -> List[Dict[str, Any]]:
        """Get all documents"""
        return list(self.documents.values())

    def update_document(self, doc_id: str, updates: Dict[str, Any]) -> bool:
        """Update document fields"""
        if doc_id in self.documents:
            self.documents[doc_id].update(updates)
            return True
        return False

    def delete_document(self, doc_id: str) -> bool:
        """Delete a document and all associated data"""
        if doc_id in self.documents:
            del self.documents[doc_id]
            # Also delete chunks and embeddings
            if doc_id in self.chunks:
                del self.chunks[doc_id]
            if doc_id in self.embeddings:
                del self.embeddings[doc_id]
            return True
        return False

    # Chunk operations (Phase 2)
    def store_chunks(self, doc_id: str, chunks: List[Dict[str, Any]]) -> bool:
        """Store chunks for a document"""
        if doc_id in self.documents:
            self.chunks[doc_id] = chunks
            return True
        return False

    def get_chunks(self, doc_id: str) -> Optional[List[Dict[str, Any]]]:
        """Get chunks for a document"""
        return self.chunks.get(doc_id)

    def get_all_chunks(self) -> List[Dict[str, Any]]:
        """Get all chunks from all documents"""
        all_chunks = []
        for doc_id, chunks in self.chunks.items():
            all_chunks.extend(chunks)
        return all_chunks

    # Embedding operations (Phase 3)
    def store_embeddings(self, doc_id: str, embeddings_data: Dict[str, Any]) -> bool:
        """Store embeddings for a document"""
        if doc_id in self.documents:
            self.embeddings[doc_id] = embeddings_data
            return True
        return False

    def get_embeddings(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """Get embeddings for a document"""
        return self.embeddings.get(doc_id)

    def get_all_embeddings(self) -> Dict[str, Any]:
        """Get all embeddings"""
        return self.embeddings

    # Configuration operations (Phase 6)
    def save_configuration(self, config_name: str, config_data: Dict[str, Any]) -> str:
        """Save a pipeline configuration"""
        config_id = str(uuid.uuid4())
        self.configurations[config_id] = {
            "id": config_id,
            "name": config_name,
            "config": config_data,
            "created_at": datetime.now()
        }
        return config_id

    def get_configuration(self, config_id: str) -> Optional[Dict[str, Any]]:
        """Get a saved configuration"""
        return self.configurations.get(config_id)

    def get_all_configurations(self) -> List[Dict[str, Any]]:
        """Get all saved configurations"""
        return list(self.configurations.values())

    # Query history (Phase 6)
    def add_query_to_history(self, query: str, results: List[Dict[str, Any]], config: Dict[str, Any]):
        """Add query to history"""
        self.query_history.append({
            "query": query,
            "results": results,
            "config": config,
            "timestamp": datetime.now()
        })
        # Keep only last 20 queries
        if len(self.query_history) > 20:
            self.query_history = self.query_history[-20:]

    def get_query_history(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent query history"""
        return self.query_history[-limit:]

    # Utility methods
    def clear_all(self):
        """Clear all data (useful for testing)"""
        self.documents.clear()
        self.chunks.clear()
        self.embeddings.clear()
        self.configurations.clear()
        self.query_history.clear()

    def get_stats(self) -> Dict[str, int]:
        """Get storage statistics"""
        return {
            "document_count": len(self.documents),
            "chunk_count": sum(len(chunks) for chunks in self.chunks.values()),
            "embedding_count": len(self.embeddings),
            "configuration_count": len(self.configurations),
            "query_history_count": len(self.query_history)
        }


# Global storage instance (singleton pattern)
storage = InMemoryStorage()
