"""
Embedding service for generating vector representations of text chunks
Phase 3: TF-IDF and Sentence Transformer embeddings
"""

from typing import List, Dict, Any, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
import uuid


class Embedder:
    """Generates embeddings for text chunks using various models"""

    def __init__(self):
        self.tfidf_vectorizer = None
        self.sentence_transformer = None
        self._sentence_transformer_loaded = False

    def _load_sentence_transformer(self, model_name: str = "all-MiniLM-L6-v2"):
        """Lazy load sentence transformer model"""
        if not self._sentence_transformer_loaded:
            try:
                from sentence_transformers import SentenceTransformer
                self.sentence_transformer = SentenceTransformer(model_name)
                self._sentence_transformer_loaded = True
            except ImportError:
                raise ImportError(
                    "sentence-transformers not installed. "
                    "Install with: pip install sentence-transformers"
                )

    def generate_tfidf_embeddings(
        self,
        chunks: List[Dict[str, Any]],
        max_features: int = 1000
    ) -> List[Dict[str, Any]]:
        """
        Generate TF-IDF embeddings for chunks

        Args:
            chunks: List of chunk dictionaries with 'text' field
            max_features: Maximum number of features for TF-IDF

        Returns:
            List of embedding dictionaries with metadata
        """
        if not chunks:
            return []

        # Extract text from chunks
        texts = [chunk["text"] for chunk in chunks]

        # Create TF-IDF vectorizer
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=max_features,
            stop_words='english',
            lowercase=True,
            ngram_range=(1, 2)  # Unigrams and bigrams
        )

        # Generate embeddings
        tfidf_matrix = self.tfidf_vectorizer.fit_transform(texts)

        # Convert to list of embeddings
        embeddings = []
        for idx, chunk in enumerate(chunks):
            embedding_vector = tfidf_matrix[idx].toarray()[0]

            embedding = {
                "embedding_id": str(uuid.uuid4()),
                "chunk_id": chunk["chunk_id"],
                "document_id": chunk["document_id"],
                "model_type": "tfidf",
                "model_name": "sklearn-tfidf",
                "embedding_vector": embedding_vector.tolist(),
                "dimension": len(embedding_vector),
                "metadata": {
                    "max_features": max_features,
                    "vocab_size": len(self.tfidf_vectorizer.vocabulary_),
                    "non_zero_features": np.count_nonzero(embedding_vector),
                    "sparsity": 1.0 - (np.count_nonzero(embedding_vector) / len(embedding_vector))
                }
            }
            embeddings.append(embedding)

        return embeddings

    def generate_sentence_transformer_embeddings(
        self,
        chunks: List[Dict[str, Any]],
        model_name: str = "all-MiniLM-L6-v2",
        batch_size: int = 32
    ) -> List[Dict[str, Any]]:
        """
        Generate dense embeddings using Sentence Transformers

        Args:
            chunks: List of chunk dictionaries with 'text' field
            model_name: Name of the sentence transformer model
            batch_size: Batch size for encoding

        Returns:
            List of embedding dictionaries with metadata
        """
        if not chunks:
            return []

        # Load model
        self._load_sentence_transformer(model_name)

        # Extract text from chunks
        texts = [chunk["text"] for chunk in chunks]

        # Generate embeddings
        embedding_vectors = self.sentence_transformer.encode(
            texts,
            batch_size=batch_size,
            show_progress_bar=True,
            convert_to_numpy=True
        )

        # Convert to list of embeddings
        embeddings = []
        for idx, chunk in enumerate(chunks):
            embedding_vector = embedding_vectors[idx]

            # Calculate L2 norm
            l2_norm = np.linalg.norm(embedding_vector)

            embedding = {
                "embedding_id": str(uuid.uuid4()),
                "chunk_id": chunk["chunk_id"],
                "document_id": chunk["document_id"],
                "model_type": "sentence_transformer",
                "model_name": model_name,
                "embedding_vector": embedding_vector.tolist(),
                "dimension": len(embedding_vector),
                "metadata": {
                    "l2_norm": float(l2_norm),
                    "mean": float(np.mean(embedding_vector)),
                    "std": float(np.std(embedding_vector)),
                    "min": float(np.min(embedding_vector)),
                    "max": float(np.max(embedding_vector))
                }
            }
            embeddings.append(embedding)

        return embeddings

    def get_embedding_statistics(self, embeddings: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculate statistics about embeddings

        Args:
            embeddings: List of embedding dictionaries

        Returns:
            Dictionary with embedding statistics
        """
        if not embeddings:
            return {
                "total_embeddings": 0,
                "model_type": None,
                "model_name": None,
                "dimension": 0,
                "total_size_mb": 0
            }

        first_embedding = embeddings[0]
        dimension = first_embedding["dimension"]
        model_type = first_embedding["model_type"]
        model_name = first_embedding["model_name"]

        # Calculate storage size (assuming float32)
        total_size_bytes = len(embeddings) * dimension * 4  # 4 bytes per float32
        total_size_mb = total_size_bytes / (1024 * 1024)

        stats = {
            "total_embeddings": len(embeddings),
            "model_type": model_type,
            "model_name": model_name,
            "dimension": dimension,
            "total_size_mb": round(total_size_mb, 2),
            "avg_size_kb": round(total_size_bytes / len(embeddings) / 1024, 2)
        }

        # Add model-specific statistics
        if model_type == "tfidf":
            avg_non_zero = np.mean([e["metadata"]["non_zero_features"] for e in embeddings])
            avg_sparsity = np.mean([e["metadata"]["sparsity"] for e in embeddings])
            stats["avg_non_zero_features"] = round(avg_non_zero, 2)
            stats["avg_sparsity"] = round(avg_sparsity, 4)
        elif model_type == "sentence_transformer":
            avg_l2_norm = np.mean([e["metadata"]["l2_norm"] for e in embeddings])
            stats["avg_l2_norm"] = round(avg_l2_norm, 4)

        return stats


# Global embedder instance
embedder = Embedder()
