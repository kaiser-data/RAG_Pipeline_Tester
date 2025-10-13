"""
RAG Pipeline Tester - FastAPI Backend
Phase 1: Basic document upload and text extraction
Phase 2: Chunking strategies
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional
from pydantic import BaseModel
import os
import shutil
from pathlib import Path
from datetime import datetime

from app.models import APIResponse, DocumentMetadata, Document
from app.storage import storage
from app.chunker import chunker

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

# Supported file types for Phase 1
SUPPORTED_TYPES = {
    ".txt": "text/plain",
    ".md": "text/markdown",
}


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
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "storage": stats
    }


@app.post("/api/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a document and extract text
    Phase 1: Supports .txt and .md files
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

        # Extract text
        try:
            text = extract_text_simple(str(file_path))
            stats = calculate_stats(text)

            # Update document with extracted text
            storage.update_document(doc_id, {
                "text": text,
                "status": "ready",
                **stats
            })

            doc = storage.get_document(doc_id)

            return APIResponse(
                success=True,
                message="Document uploaded and processed successfully",
                data={
                    "document_id": doc_id,
                    "filename": file.filename,
                    "file_size": file_size,
                    "status": "ready",
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
    strategy: str = "fixed"  # "fixed" or "recursive"
    chunk_size: int = 500
    overlap: int = 50
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
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported chunking strategy: {request.strategy}"
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
