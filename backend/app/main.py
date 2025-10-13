"""
RAG Pipeline Tester - FastAPI Backend
Phase 1: Basic document upload and text extraction
Phase 2: Chunking strategies
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict
from pydantic import BaseModel
import os
import shutil
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from app.models import APIResponse, DocumentMetadata, Document
from app.storage import storage
from app.chunker import chunker
from app.embedder import embedder
from app.vector_store import create_vector_store, VectorStore, VectorStoreManager
from app.extractor import extractor
from app.rag_engine import initialize_rag_engine, get_rag_engine

# Initialize FastAPI app
app = FastAPI(
    title="RAG Pipeline Tester API",
    description="API for testing and tuning RAG pipelines",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite default
        "http://localhost:3000",  # Alternative React port
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
UPLOAD_DIR = Path("../uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10MB

# Supported file types - Phase 5: Extended support
SUPPORTED_TYPES = {
    ".txt": "text/plain",
    ".md": "text/markdown",
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

# Initialize vector stores
vector_stores: Dict[str, VectorStore] = {
    "chromadb": create_vector_store("chromadb", persist_directory="./chroma_db"),
    "faiss": create_vector_store("faiss", index_directory="./faiss_indexes")
}

# Initialize vector store manager for RAG engine
vector_store_manager = VectorStoreManager(vector_stores)

# Initialize RAG engine (Phase 6)
# API keys can be set via environment variables: OPENAI_API_KEY, ANTHROPIC_API_KEY
rag_engine = initialize_rag_engine(
    vector_store_manager=vector_store_manager,
    openai_api_key=os.getenv("OPENAI_API_KEY"),
    anthropic_api_key=os.getenv("ANTHROPIC_API_KEY"),
    ollama_base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
)


# Utility functions
def get_file_type(filename: str) -> str:
    """Get file type from filename"""
    ext = os.path.splitext(filename)[1].lower()
    if ext in [".txt", ".md"]:
        return "txt"
    elif ext == ".pdf":
        return "pdf"
    elif ext == ".docx":
        return "docx"
    return "unknown"


def extract_text_simple(file_path: str) -> str:
    """
    Simple text extraction for Phase 1
    Only handles .txt and .md files
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            text = f.read()
        return text
    except UnicodeDecodeError:
        # Try with different encoding
        with open(file_path, 'r', encoding='latin-1') as f:
            text = f.read()
        return text


def calculate_stats(text: str) -> dict:
    """Calculate text statistics"""
    char_count = len(text)
    word_count = len(text.split())
    # Rough token estimation: ~4 chars per token
    estimated_tokens = char_count // 4
    return {
        "char_count": char_count,
        "word_count": word_count,
        "estimated_tokens": estimated_tokens
    }


# API Endpoints

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "RAG Pipeline Tester API",
        "version": "1.0.0",
        "phase": "1 - Basic Upload & Extraction",
        "status": "running"
    }


@app.get("/api/health")
async def health_check():
    """Detailed health check with storage stats"""
    stats = storage.get_stats()
    extraction_capabilities = extractor.get_extraction_capabilities()
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "storage": stats,
        "extraction": extraction_capabilities
    }


@app.post("/api/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a document and extract text
    Phase 5: Supports .txt, .md, .pdf, and .docx files using Docling
    """
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")

        # Check file extension
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in SUPPORTED_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type. Supported types: {', '.join(SUPPORTED_TYPES.keys())}"
            )

        # Read file content
        content = await file.read()
        file_size = len(content)

        # Check file size
        if file_size > MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size: {MAX_UPLOAD_SIZE / 1024 / 1024}MB"
            )

        # Save file
        file_path = UPLOAD_DIR / file.filename
        with open(file_path, "wb") as f:
            f.write(content)

        # Create document entry
        file_type = get_file_type(file.filename)
        doc_id = storage.create_document(
            filename=file.filename,
            file_path=str(file_path),
            file_size=file_size,
            file_type=file_type
        )

        # Extract text using the new extractor
        # use_docling=False for faster extraction (PyPDF2/pdfplumber instead of Docling)
        try:
            extraction_result = extractor.extract_text(
                file_path=str(file_path),
                file_type=file_type,
                use_docling=False  # Changed to False for faster processing
            )

            text = extraction_result["text"]
            stats = calculate_stats(text)

            # Update document with extracted text and metadata
            storage.update_document(doc_id, {
                "text": text,
                "status": "ready",
                "extraction_method": extraction_result["method"],
                "pages": extraction_result.get("pages", 1),
                "has_tables": extraction_result.get("has_tables", False),
                "has_images": extraction_result.get("has_images", False),
                **stats
            })

            doc = storage.get_document(doc_id)

            return APIResponse(
                success=True,
                message=f"Document uploaded and processed successfully using {extraction_result['method']}",
                data={
                    "document_id": doc_id,
                    "filename": file.filename,
                    "file_size": file_size,
                    "file_type": file_type,
                    "status": "ready",
                    "extraction_method": extraction_result["method"],
                    "pages": extraction_result.get("pages", 1),
                    "has_tables": extraction_result.get("has_tables", False),
                    "has_images": extraction_result.get("has_images", False),
                    "stats": stats,
                    "text_preview": text[:500] if text else None  # First 500 chars
                }
            )

        except Exception as e:
            # Update document with error
            storage.update_document(doc_id, {
                "status": "error",
                "error_message": str(e)
            })
            raise HTTPException(status_code=500, detail=f"Error extracting text: {str(e)}")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@app.get("/api/documents")
async def get_documents():
    """Get all uploaded documents"""
    try:
        documents = storage.get_all_documents()

        # Convert to response format
        doc_list = []
        for doc in documents:
            doc_list.append({
                "id": doc["id"],
                "filename": doc["filename"],
                "file_size": doc["file_size"],
                "file_type": doc["file_type"],
                "upload_timestamp": doc["upload_timestamp"].isoformat(),
                "status": doc["status"],
                "char_count": doc.get("char_count"),
                "word_count": doc.get("word_count"),
                "estimated_tokens": doc.get("estimated_tokens"),
                "error_message": doc.get("error_message")
            })

        return APIResponse(
            success=True,
            message=f"Retrieved {len(doc_list)} documents",
            data={"documents": doc_list}
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving documents: {str(e)}")


@app.get("/api/documents/{doc_id}")
async def get_document(doc_id: str):
    """Get a specific document with full text"""
    try:
        doc = storage.get_document(doc_id)

        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        return APIResponse(
            success=True,
            message="Document retrieved successfully",
            data={
                "document": {
                    "id": doc["id"],
                    "filename": doc["filename"],
                    "file_size": doc["file_size"],
                    "file_type": doc["file_type"],
                    "upload_timestamp": doc["upload_timestamp"].isoformat(),
                    "status": doc["status"],
                    "text": doc.get("text"),
                    "char_count": doc.get("char_count"),
                    "word_count": doc.get("word_count"),
                    "estimated_tokens": doc.get("estimated_tokens"),
                    "error_message": doc.get("error_message")
                }
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving document: {str(e)}")


@app.delete("/api/documents/{doc_id}")
async def delete_document(doc_id: str):
    """Delete a document"""
    try:
        doc = storage.get_document(doc_id)

        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        # Delete file from disk
        file_path = Path(doc["file_path"])
        if file_path.exists():
            file_path.unlink()

        # Delete from storage
        storage.delete_document(doc_id)

        return APIResponse(
            success=True,
            message="Document deleted successfully",
            data={"document_id": doc_id}
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting document: {str(e)}")


# Phase 2: Chunking endpoints

class ChunkRequest(BaseModel):
    """Request model for chunking"""
    document_id: str
    strategy: str = "fixed"  # "fixed", "recursive", "sentence", "semantic", "sliding_window"
    chunk_size: int = 500
    overlap: int = 50
    stride: Optional[int] = 250  # For sliding window
    separators: Optional[List[str]] = None


@app.post("/api/chunk")
async def chunk_document(request: ChunkRequest):
    """
    Chunk a document using specified strategy
    Phase 2: Supports fixed-size and recursive chunking
    """
    try:
        # Get document
        doc = storage.get_document(request.document_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        # Check if document has text
        text = doc.get("text")
        if not text:
            raise HTTPException(
                status_code=400,
                detail="Document has no text content. Process document first."
            )

        # Perform chunking based on strategy
        if request.strategy == "fixed":
            chunks = chunker.chunk_fixed_size(
                text=text,
                chunk_size=request.chunk_size,
                overlap=request.overlap,
                doc_id=request.document_id
            )
        elif request.strategy == "recursive":
            chunks = chunker.chunk_recursive(
                text=text,
                chunk_size=request.chunk_size,
                overlap=request.overlap,
                doc_id=request.document_id,
                separators=request.separators
            )
        elif request.strategy == "sentence":
            chunks = chunker.chunk_sentence(
                text=text,
                chunk_size=request.chunk_size,
                overlap=request.overlap,
                doc_id=request.document_id
            )
        elif request.strategy == "semantic":
            chunks = chunker.chunk_semantic(
                text=text,
                chunk_size=request.chunk_size,
                overlap=request.overlap,
                doc_id=request.document_id
            )
        elif request.strategy == "sliding_window":
            chunks = chunker.chunk_sliding_window(
                text=text,
                window_size=request.chunk_size,
                stride=request.stride or request.chunk_size - request.overlap,
                doc_id=request.document_id
            )
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported chunking strategy: {request.strategy}. Supported: fixed, recursive, sentence, semantic, sliding_window"
            )

        # Store chunks
        storage.store_chunks(request.document_id, chunks)

        # Calculate statistics
        stats = chunker.get_chunk_statistics(chunks)

        # Return preview (first 3 chunks)
        preview_chunks = chunks[:3]

        return APIResponse(
            success=True,
            message=f"Document chunked successfully using {request.strategy} strategy",
            data={
                "document_id": request.document_id,
                "strategy": request.strategy,
                "chunk_size": request.chunk_size,
                "overlap": request.overlap,
                "total_chunks": len(chunks),
                "statistics": stats,
                "preview": preview_chunks
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chunking failed: {str(e)}")


@app.get("/api/documents/{doc_id}/chunks")
async def get_document_chunks(doc_id: str):
    """Get all chunks for a document"""
    try:
        doc = storage.get_document(doc_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        chunks = storage.get_chunks(doc_id)
        if not chunks:
            return APIResponse(
                success=True,
                message="No chunks found for this document",
                data={"chunks": [], "total": 0}
            )

        stats = chunker.get_chunk_statistics(chunks)

        return APIResponse(
            success=True,
            message=f"Retrieved {len(chunks)} chunks",
            data={
                "document_id": doc_id,
                "chunks": chunks,
                "total": len(chunks),
                "statistics": stats
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving chunks: {str(e)}")


# Phase 3: Embedding endpoints

class EmbeddingRequest(BaseModel):
    """Request model for embedding generation"""
    document_id: str
    model_type: str = "tfidf"  # "tfidf" or "sentence_transformer"
    model_name: Optional[str] = None  # For sentence transformers (e.g., "all-MiniLM-L6-v2")
    max_features: int = 1000  # For TF-IDF
    batch_size: int = 32  # For sentence transformers


@app.post("/api/embed")
async def generate_embeddings(request: EmbeddingRequest):
    """
    Generate embeddings for document chunks
    Phase 3: Supports TF-IDF and Sentence Transformer embeddings
    """
    try:
        # Get document
        doc = storage.get_document(request.document_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        # Get chunks for document
        chunks = storage.get_chunks(request.document_id)
        if not chunks:
            raise HTTPException(
                status_code=400,
                detail="No chunks found for this document. Chunk document first."
            )

        # Generate embeddings based on model type
        if request.model_type == "tfidf":
            embeddings = embedder.generate_tfidf_embeddings(
                chunks=chunks,
                max_features=request.max_features
            )
        elif request.model_type == "sentence_transformer":
            model_name = request.model_name or "all-MiniLM-L6-v2"
            try:
                embeddings = embedder.generate_sentence_transformer_embeddings(
                    chunks=chunks,
                    model_name=model_name,
                    batch_size=request.batch_size
                )
            except ImportError as e:
                raise HTTPException(
                    status_code=400,
                    detail="Sentence transformers not installed. Install with: pip install sentence-transformers"
                )
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported model type: {request.model_type}. Supported: tfidf, sentence_transformer"
            )

        # Store embeddings
        embeddings_data = {
            "model_type": request.model_type,
            "model_name": request.model_name or ("sklearn-tfidf" if request.model_type == "tfidf" else "all-MiniLM-L6-v2"),
            "embeddings": embeddings
        }
        storage.store_embeddings(request.document_id, embeddings_data)

        # Calculate statistics
        stats = embedder.get_embedding_statistics(embeddings)

        # Return preview (first 3 embeddings without full vectors to save bandwidth)
        preview_embeddings = []
        for emb in embeddings[:3]:
            preview = {k: v for k, v in emb.items() if k != "embedding_vector"}
            preview["vector_preview"] = emb["embedding_vector"][:10]  # First 10 dimensions
            preview_embeddings.append(preview)

        return APIResponse(
            success=True,
            message=f"Embeddings generated successfully using {request.model_type}",
            data={
                "document_id": request.document_id,
                "model_type": request.model_type,
                "model_name": embeddings_data["model_name"],
                "total_embeddings": len(embeddings),
                "statistics": stats,
                "preview": preview_embeddings
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding generation failed: {str(e)}")


@app.get("/api/documents/{doc_id}/embeddings")
async def get_document_embeddings(doc_id: str, include_vectors: bool = False):
    """
    Get embeddings for a document

    Args:
        doc_id: Document ID
        include_vectors: If True, include full embedding vectors (can be large)
    """
    try:
        doc = storage.get_document(doc_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        embeddings_data = storage.get_embeddings(doc_id)
        if not embeddings_data:
            return APIResponse(
                success=True,
                message="No embeddings found for this document",
                data={"embeddings": None}
            )

        # If not including vectors, remove them to reduce response size
        if not include_vectors:
            embeddings_summary = {
                "model_type": embeddings_data["model_type"],
                "model_name": embeddings_data["model_name"],
                "total_embeddings": len(embeddings_data["embeddings"]),
                "embeddings_metadata": []
            }

            for emb in embeddings_data["embeddings"]:
                metadata = {k: v for k, v in emb.items() if k != "embedding_vector"}
                metadata["vector_shape"] = [emb["dimension"]]
                embeddings_summary["embeddings_metadata"].append(metadata)

            stats = embedder.get_embedding_statistics(embeddings_data["embeddings"])

            return APIResponse(
                success=True,
                message="Embeddings retrieved successfully (metadata only)",
                data={
                    "document_id": doc_id,
                    "embeddings": embeddings_summary,
                    "statistics": stats
                }
            )
        else:
            # Include full vectors
            stats = embedder.get_embedding_statistics(embeddings_data["embeddings"])

            return APIResponse(
                success=True,
                message="Embeddings retrieved successfully (with vectors)",
                data={
                    "document_id": doc_id,
                    "embeddings": embeddings_data,
                    "statistics": stats
                }
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving embeddings: {str(e)}")


# Phase 4: Vector Storage and Search endpoints

class StoreRequest(BaseModel):
    """Request model for storing embeddings in vector database"""
    document_id: str
    backend: str = "chromadb"  # "chromadb" or "faiss"
    collection_name: str = "default"


class SearchRequest(BaseModel):
    """Request model for similarity search"""
    query_text: str
    backend: str = "chromadb"  # "chromadb" or "faiss"
    collection_name: str = "default"
    top_k: int = 5
    model_type: str = "tfidf"  # Same model used for embeddings
    model_name: Optional[str] = None


@app.post("/api/store")
async def store_vectors(request: StoreRequest):
    """
    Store document embeddings in vector database
    Phase 4: Store vectors in ChromaDB or FAISS
    """
    try:
        # Validate backend
        if request.backend not in vector_stores:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported backend: {request.backend}. Choose 'chromadb' or 'faiss'"
            )

        # Get document
        doc = storage.get_document(request.document_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        # Get embeddings
        embeddings_data = storage.get_embeddings(request.document_id)
        if not embeddings_data:
            raise HTTPException(
                status_code=400,
                detail="No embeddings found for this document. Generate embeddings first."
            )

        # Get chunks for metadata
        chunks = storage.get_chunks(request.document_id)
        if not chunks:
            raise HTTPException(
                status_code=400,
                detail="No chunks found for this document."
            )

        # Prepare vectors and metadata
        vectors = []
        metadata = []

        for emb in embeddings_data["embeddings"]:
            vectors.append(emb["embedding_vector"])

            # Find corresponding chunk
            chunk_id = emb["chunk_id"]
            chunk = next((c for c in chunks if c["chunk_id"] == chunk_id), None)

            meta = {
                "id": chunk_id,
                "text": chunk["text"] if chunk else "",
                "document_id": request.document_id,
                "chunk_index": chunk["chunk_index"] if chunk else 0,
                "model_type": embeddings_data["model_type"],
                "model_name": embeddings_data["model_name"]
            }
            metadata.append(meta)

        # Store in vector database
        vector_store = vector_stores[request.backend]
        result = vector_store.add_vectors(
            vectors=vectors,
            metadata=metadata,
            collection_name=request.collection_name
        )

        return APIResponse(
            success=True,
            message=f"Vectors stored successfully in {request.backend}",
            data={
                "document_id": request.document_id,
                "backend": request.backend,
                "collection": request.collection_name,
                "stored_count": result["added_count"],
                "result": result
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage failed: {str(e)}")


@app.post("/api/search")
async def search_vectors(request: SearchRequest):
    """
    Perform similarity search in vector database
    Phase 4: Search using ChromaDB or FAISS
    """
    try:
        # Validate backend
        if request.backend not in vector_stores:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported backend: {request.backend}. Choose 'chromadb' or 'faiss'"
            )

        # Generate query embedding
        if request.model_type == "tfidf":
            # For TF-IDF, we need to use the same vectorizer
            # This is a limitation - in production, you'd store the vectorizer
            raise HTTPException(
                status_code=400,
                detail="TF-IDF search requires pre-fitted vectorizer. Use sentence_transformer for now."
            )
        elif request.model_type == "sentence_transformer":
            model_name = request.model_name or "all-MiniLM-L6-v2"
            try:
                # Generate embedding for query
                query_chunk = {
                    "chunk_id": "query",
                    "document_id": "query",
                    "text": request.query_text,
                    "chunk_index": 0
                }
                query_embeddings = embedder.generate_sentence_transformer_embeddings(
                    chunks=[query_chunk],
                    model_name=model_name,
                    batch_size=1
                )
                query_vector = query_embeddings[0]["embedding_vector"]
            except ImportError:
                raise HTTPException(
                    status_code=400,
                    detail="Sentence transformers not installed."
                )
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported model type: {request.model_type}"
            )

        # Perform search
        vector_store = vector_stores[request.backend]
        results = vector_store.search(
            query_vector=query_vector,
            top_k=request.top_k,
            collection_name=request.collection_name
        )

        return APIResponse(
            success=True,
            message=f"Search completed using {request.backend}",
            data={
                "query": request.query_text,
                "backend": request.backend,
                "collection": request.collection_name,
                "top_k": request.top_k,
                "results_count": len(results),
                "results": results
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@app.get("/api/collections")
async def list_collections(backend: str = "chromadb"):
    """
    List all collections in vector database
    """
    try:
        if backend not in vector_stores:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported backend: {backend}"
            )

        vector_store = vector_stores[backend]
        collections = vector_store.list_collections()

        return APIResponse(
            success=True,
            message=f"Retrieved collections from {backend}",
            data={
                "backend": backend,
                "collections": collections,
                "count": len(collections)
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list collections: {str(e)}")


@app.delete("/api/collections/{collection_name}")
async def delete_collection(collection_name: str, backend: str = "chromadb"):
    """
    Delete a collection from vector database
    """
    try:
        if backend not in vector_stores:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported backend: {backend}"
            )

        vector_store = vector_stores[backend]
        success = vector_store.delete_collection(collection_name)

        if not success:
            raise HTTPException(
                status_code=404,
                detail=f"Collection '{collection_name}' not found"
            )

        return APIResponse(
            success=True,
            message=f"Collection '{collection_name}' deleted from {backend}",
            data={
                "backend": backend,
                "collection": collection_name
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete collection: {str(e)}")


@app.get("/api/collections/{collection_name}/stats")
async def get_collection_stats(collection_name: str, backend: str = "chromadb"):
    """
    Get statistics for a collection
    """
    try:
        if backend not in vector_stores:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported backend: {backend}"
            )

        vector_store = vector_stores[backend]
        stats = vector_store.get_stats(collection_name)

        return APIResponse(
            success=True,
            message=f"Retrieved stats for collection '{collection_name}'",
            data={
                "backend": backend,
                "stats": stats
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")


# Phase 6: RAG Query endpoints

class RAGQueryRequest(BaseModel):
    """Request model for RAG query"""
    question: str
    provider: str  # "openai", "anthropic", "ollama"
    collection_name: str = "default"
    backend: str = "chromadb"
    top_k: int = 3
    temperature: float = 0.7
    max_tokens: int = 1000


class RAGCompareRequest(BaseModel):
    """Request model for comparing RAG providers"""
    question: str
    collection_name: str = "default"
    backend: str = "chromadb"
    providers: Optional[List[str]] = None  # None = all available
    top_k: int = 3
    temperature: float = 0.7
    max_tokens: int = 1000


@app.get("/api/rag/providers")
async def get_available_providers():
    """
    Get list of available LLM providers
    Phase 6: Check which providers are configured and available
    """
    try:
        providers = rag_engine.get_available_providers()

        return APIResponse(
            success=True,
            message=f"Found {len(providers)} available providers",
            data={
                "providers": providers,
                "count": len(providers)
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get providers: {str(e)}")


@app.post("/api/rag/query")
async def rag_query(request: RAGQueryRequest):
    """
    Execute RAG query with specified provider
    Phase 6: Retrieve context and generate answer
    """
    try:
        result = rag_engine.query(
            question=request.question,
            provider_name=request.provider,
            collection_name=request.collection_name,
            backend=request.backend,
            top_k=request.top_k,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )

        return APIResponse(
            success=True,
            message="RAG query completed successfully",
            data=result
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG query failed: {str(e)}")


@app.post("/api/rag/compare")
async def rag_compare(request: RAGCompareRequest):
    """
    Compare RAG answers from multiple providers
    Phase 6: Same context, different providers
    """
    try:
        result = rag_engine.compare_providers(
            question=request.question,
            collection_name=request.collection_name,
            backend=request.backend,
            providers=request.providers,
            top_k=request.top_k,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )

        return APIResponse(
            success=True,
            message="Provider comparison completed successfully",
            data=result
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Provider comparison failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
