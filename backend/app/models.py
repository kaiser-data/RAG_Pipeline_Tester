"""
Pydantic models for request/response schemas
Phase 1: Basic document models
"""

from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from datetime import datetime


# Response wrapper for consistent API responses
class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None
    errors: Optional[List[str]] = None


# Document metadata
class DocumentMetadata(BaseModel):
    id: str
    filename: str
    file_size: int
    upload_timestamp: datetime
    status: str  # "processing", "ready", "error"
    file_type: str  # "txt", "pdf", "docx", "md"
    error_message: Optional[str] = None


# Document with extracted text
class Document(BaseModel):
    metadata: DocumentMetadata
    text: Optional[str] = None
    char_count: Optional[int] = None
    word_count: Optional[int] = None
    estimated_tokens: Optional[int] = None


# Text extraction response
class ExtractionResult(BaseModel):
    document_id: str
    text: str
    metadata: Dict[str, Any]
    stats: Dict[str, int]  # char_count, word_count, estimated_tokens


# For Phase 2: Chunking models (placeholder)
class ChunkMetadata(BaseModel):
    chunk_id: str
    document_id: str
    chunk_index: int
    char_count: int
    estimated_tokens: int


class Chunk(BaseModel):
    metadata: ChunkMetadata
    text: str


# For Phase 3: Embedding models (placeholder)
class EmbeddingConfig(BaseModel):
    model_type: str  # "simulated", "tfidf", "sentence-transformer"
    model_name: Optional[str] = None
    dimensions: int


# For Phase 4: Query models (placeholder)
class QueryRequest(BaseModel):
    query: str
    top_k: int = 5
    threshold: Optional[float] = None


class QueryResult(BaseModel):
    rank: int
    score: float
    chunk: Chunk
    document_name: str
