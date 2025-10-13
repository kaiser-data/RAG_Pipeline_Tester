"""
Chunking service for splitting documents into smaller pieces
Phase 2: Fixed-size and Recursive chunking strategies
"""

from typing import List, Dict, Any
import re
import uuid


class Chunker:
    """Document chunking with multiple strategies"""

    def __init__(self):
        pass

    def chunk_fixed_size(
        self,
        text: str,
        chunk_size: int = 500,
        overlap: int = 50,
        doc_id: str = None
    ) -> List[Dict[str, Any]]:
        """
        Fixed-size chunking: Split text into chunks of specified size with overlap

        Args:
            text: Text to chunk
            chunk_size: Target chunk size in characters
            overlap: Number of characters to overlap between chunks
            doc_id: Document ID for tracking

        Returns:
            List of chunk dictionaries with metadata
        """
        if not text:
            return []

        chunks = []
        start = 0
        chunk_index = 0

        while start < len(text):
            # Calculate end position
            end = start + chunk_size

            # Get chunk text
            chunk_text = text[start:end]

            # Skip empty chunks
            if chunk_text.strip():
                chunk_id = str(uuid.uuid4())
                estimated_tokens = len(chunk_text) // 4  # Rough estimation

                chunks.append({
                    "chunk_id": chunk_id,
                    "document_id": doc_id or "unknown",
                    "chunk_index": chunk_index,
                    "text": chunk_text,
                    "char_count": len(chunk_text),
                    "estimated_tokens": estimated_tokens,
                    "start_char": start,
                    "end_char": end
                })
                chunk_index += 1

            # Move to next chunk with overlap
            start = start + chunk_size - overlap

        return chunks

    def chunk_recursive(
        self,
        text: str,
        chunk_size: int = 500,
        overlap: int = 50,
        doc_id: str = None,
        separators: List[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Recursive chunking: Split text respecting document structure
        Tries to split at natural boundaries (paragraphs, sentences, etc.)

        Args:
            text: Text to chunk
            chunk_size: Target chunk size in characters
            overlap: Number of characters to overlap between chunks
            doc_id: Document ID for tracking
            separators: List of separators in order of preference

        Returns:
            List of chunk dictionaries with metadata
        """
        if separators is None:
            # Default separators in order of preference
            separators = [
                "\n\n",  # Paragraph breaks
                "\n",    # Line breaks
                ". ",    # Sentence endings
                "! ",    # Exclamation endings
                "? ",    # Question endings
                "; ",    # Semicolons
                ", ",    # Commas
                " ",     # Spaces
            ]

        if not text:
            return []

        # Split text using recursive strategy
        splits = self._recursive_split(text, chunk_size, separators)

        # Convert splits to chunks with metadata
        chunks = []
        chunk_index = 0
        current_pos = 0

        for split_text in splits:
            if split_text.strip():
                chunk_id = str(uuid.uuid4())
                estimated_tokens = len(split_text) // 4

                chunks.append({
                    "chunk_id": chunk_id,
                    "document_id": doc_id or "unknown",
                    "chunk_index": chunk_index,
                    "text": split_text,
                    "char_count": len(split_text),
                    "estimated_tokens": estimated_tokens,
                    "start_char": current_pos,
                    "end_char": current_pos + len(split_text)
                })
                chunk_index += 1
                current_pos += len(split_text)

        # Add overlap if needed
        if overlap > 0 and len(chunks) > 1:
            chunks = self._add_overlap_to_chunks(chunks, overlap, text)

        return chunks

    def _recursive_split(
        self,
        text: str,
        chunk_size: int,
        separators: List[str]
    ) -> List[str]:
        """
        Recursively split text using separators
        """
        if len(text) <= chunk_size:
            return [text]

        # Try each separator
        for separator in separators:
            if separator in text:
                # Split by this separator
                parts = text.split(separator)

                # Reconstruct with separator
                result = []
                current_chunk = ""

                for i, part in enumerate(parts):
                    # Add separator back (except for last part)
                    if i < len(parts) - 1:
                        part_with_sep = part + separator
                    else:
                        part_with_sep = part

                    # Check if adding this part exceeds chunk size
                    if len(current_chunk) + len(part_with_sep) <= chunk_size:
                        current_chunk += part_with_sep
                    else:
                        # Save current chunk if not empty
                        if current_chunk:
                            result.append(current_chunk)

                        # Start new chunk
                        if len(part_with_sep) > chunk_size:
                            # This part is too big, recursively split it
                            sub_splits = self._recursive_split(
                                part_with_sep,
                                chunk_size,
                                separators[separators.index(separator) + 1:]
                                if separators.index(separator) + 1 < len(separators)
                                else [" "]
                            )
                            result.extend(sub_splits)
                            current_chunk = ""
                        else:
                            current_chunk = part_with_sep

                # Add remaining chunk
                if current_chunk:
                    result.append(current_chunk)

                return result

        # No separator found, split by chunk size
        return [text[i:i + chunk_size] for i in range(0, len(text), chunk_size)]

    def _add_overlap_to_chunks(
        self,
        chunks: List[Dict[str, Any]],
        overlap: int,
        original_text: str
    ) -> List[Dict[str, Any]]:
        """
        Add overlap between chunks by extending each chunk to include
        characters from the next chunk
        """
        if overlap <= 0 or len(chunks) <= 1:
            return chunks

        overlapped_chunks = []

        for i, chunk in enumerate(chunks):
            chunk_copy = chunk.copy()

            # Add overlap from next chunk (if not last chunk)
            if i < len(chunks) - 1:
                next_chunk = chunks[i + 1]
                overlap_text = next_chunk["text"][:overlap]
                chunk_copy["text"] = chunk["text"] + overlap_text
                chunk_copy["char_count"] = len(chunk_copy["text"])
                chunk_copy["estimated_tokens"] = chunk_copy["char_count"] // 4
                chunk_copy["end_char"] = chunk_copy["start_char"] + chunk_copy["char_count"]

            overlapped_chunks.append(chunk_copy)

        return overlapped_chunks

    def get_chunk_statistics(self, chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculate statistics about chunks
        """
        if not chunks:
            return {
                "total_chunks": 0,
                "total_chars": 0,
                "total_tokens": 0,
                "avg_chunk_size": 0,
                "min_chunk_size": 0,
                "max_chunk_size": 0
            }

        char_counts = [chunk["char_count"] for chunk in chunks]
        token_counts = [chunk["estimated_tokens"] for chunk in chunks]

        return {
            "total_chunks": len(chunks),
            "total_chars": sum(char_counts),
            "total_tokens": sum(token_counts),
            "avg_chunk_size": sum(char_counts) // len(chunks),
            "min_chunk_size": min(char_counts),
            "max_chunk_size": max(char_counts),
            "chunk_size_distribution": {
                "small": len([c for c in char_counts if c < 300]),
                "medium": len([c for c in char_counts if 300 <= c < 700]),
                "large": len([c for c in char_counts if c >= 700])
            }
        }


# Global chunker instance
chunker = Chunker()
