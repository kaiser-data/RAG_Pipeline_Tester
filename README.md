# RAG Pipeline Tester

A full-stack web application for testing and tuning RAG (Retrieval-Augmented Generation) pipelines. Experiment with different extraction methods, chunking strategies, embedding models, and vector search configurations.

## 🎯 Project Status

**Current Phase: Phase 1 - Document Upload & Text Extraction** ✅

This is an iterative project built in phases. Each phase adds new functionality while maintaining stability.

### Completed
- ✅ Phase 1: Basic document upload and text extraction

### Roadmap
- 📋 Phase 2: Chunking strategies (Fixed-size, Recursive)
- 📋 Phase 3: Embeddings (Simulated, TF-IDF, Local models)
- 📋 Phase 4: Vector search with FAISS
- 📋 Phase 5: Enhanced extraction (PDF, DOCX, advanced chunking)
- 📋 Phase 6: Comparison tools and analytics
- 📋 Phase 7: Production features and polish

## 🏗️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Python 3.9+** - Core language
- **FAISS** - Vector similarity search (Phase 4+)
- **In-Memory Storage** - Simple dict-based storage

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## 📦 Installation

### Prerequisites
- Python 3.9 or higher
- Node.js 18 or higher
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create .env file (optional):
```bash
cp .env.example .env
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

## 🚀 Running the Application

### Start Backend

From the `backend` directory:

```bash
# Development mode with auto-reload
uvicorn app.main:app --reload

# Or using Python
python -m app.main
```

The API will be available at `http://localhost:8000`

API documentation (Swagger UI): `http://localhost:8000/docs`

### Start Frontend

From the `frontend` directory:

```bash
npm run dev
```

The UI will be available at `http://localhost:5173`

## 📖 Phase 1 Usage Guide

### Uploading Documents

1. **Click "Select File"** in the upload area
2. **Choose a .txt or .md file** (up to 10MB)
3. **Wait for processing** - should be instant for text files
4. **View the document** in the list below

### Viewing Extracted Text

1. **Click on a document** in the list
2. **View statistics**: Characters, words, estimated tokens
3. **Read the full text** in the right panel
4. **Copy text** using the copy button

### Managing Documents

- **Delete**: Click the trash icon next to any document
- **Status indicators**:
  - 🟢 Ready - Document processed successfully
  - 🟡 Processing - Still being processed
  - 🔴 Error - Processing failed

## 🧪 Testing Phase 1

### Quick Test

1. Upload the sample file: `sample_docs/sample_text.txt`
2. Verify it appears in the document list
3. Click on it to view the extracted text
4. Check that statistics are displayed correctly
5. Try copying the text
6. Delete the document

### Create Your Own Test Files

Create a simple text file:
```bash
echo "This is a test document for RAG pipeline testing." > test.txt
```

Upload it through the UI.

## 📁 Project Structure

```
rag-pipeline-tester/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI application
│   │   ├── models.py        # Pydantic models
│   │   ├── storage.py       # In-memory storage
│   │   └── __init__.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DocumentUpload.tsx
│   │   │   ├── DocumentList.tsx
│   │   │   └── TextDisplay.tsx
│   │   ├── utils/
│   │   │   └── api.ts       # API client
│   │   ├── types/
│   │   │   └── index.ts     # TypeScript types
│   │   ├── App.tsx          # Main app component
│   │   ├── main.tsx         # Entry point
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── uploads/                  # Uploaded files (created automatically)
├── sample_docs/             # Sample documents for testing
└── README.md
```

## 🔧 API Endpoints (Phase 1)

### Health Check
```
GET /api/health
```

### Upload Document
```
POST /api/upload
Content-Type: multipart/form-data

Body: file (binary)

Response:
{
  "success": true,
  "message": "Document uploaded and processed successfully",
  "data": {
    "document_id": "uuid",
    "filename": "sample.txt",
    "file_size": 1024,
    "status": "ready",
    "stats": {
      "char_count": 500,
      "word_count": 100,
      "estimated_tokens": 125
    },
    "text_preview": "First 500 characters..."
  }
}
```

### Get All Documents
```
GET /api/documents

Response:
{
  "success": true,
  "message": "Retrieved N documents",
  "data": {
    "documents": [...]
  }
}
```

### Get Document by ID
```
GET /api/documents/{doc_id}

Response:
{
  "success": true,
  "message": "Document retrieved successfully",
  "data": {
    "document": {
      "id": "uuid",
      "filename": "sample.txt",
      "text": "Full document text...",
      ...
    }
  }
}
```

### Delete Document
```
DELETE /api/documents/{doc_id}

Response:
{
  "success": true,
  "message": "Document deleted successfully",
  "data": {
    "document_id": "uuid"
  }
}
```

## 🐛 Troubleshooting

### Backend won't start

**Error: "Port 8000 already in use"**
- Kill the process using port 8000 or change the port in `main.py`

**Error: "Module not found"**
- Make sure you're in the backend directory
- Activate virtual environment
- Run `pip install -r requirements.txt`

### Frontend won't start

**Error: "Cannot find module"**
- Run `npm install` in the frontend directory
- Delete `node_modules` and `package-lock.json`, then reinstall

### Upload fails

**Error: "Network error"**
- Check if backend is running on port 8000
- Check browser console for CORS errors
- Verify file is .txt or .md format

### Text not displaying

**Error: Document shows as "processing"**
- Check backend console for errors
- Try uploading a simple text file first
- Verify file encoding is UTF-8

## 🎨 UI Features

### Dark Theme
- Modern dark mode UI optimized for long coding sessions
- Purple/blue accent colors for primary actions
- Color-coded status indicators

### Responsive Design
- Optimized for desktop use (1920x1080+)
- Two-column layout for efficient document viewing
- Sticky right panel for continuous text viewing

### User Feedback
- Loading states for all async operations
- Success/error messages with clear colors
- Real-time document statistics

## 📊 Performance

### Current Metrics (Phase 1)
- Text file upload: < 500ms
- Document list refresh: < 100ms
- Text display: Instant
- Memory usage: Minimal (in-memory storage)

### Limits
- Max file size: 10MB
- Supported formats: .txt, .md (Phase 1 only)
- Concurrent users: Single-user (no authentication)

## 🔒 Security Notes

**⚠️ Development Only**
This is a development tool, not production-ready:
- No authentication
- Files stored in plain text
- In-memory storage (data lost on restart)
- No input sanitization beyond file type
- CORS enabled for localhost only

## 🚧 Coming in Phase 2

### Chunking Strategies
- Fixed-size chunking with configurable parameters
- Recursive chunking that respects document structure
- Chunk preview and statistics
- Visual chunk size distribution

### UI Enhancements
- Chunking configuration panel
- Chunk preview component
- Real-time chunk statistics
- Parameter sliders and controls

## 🤝 Development Notes

### Adding New Features

Each phase builds on previous phases:
1. Backend endpoints first (test with Swagger UI)
2. Frontend components second (test with mock data if needed)
3. Integration testing
4. Documentation updates

### Code Style
- Backend: PEP 8, type hints, docstrings
- Frontend: ESLint, TypeScript strict mode, functional components
- Comments for complex logic

### Testing Strategy
- Manual testing for each phase
- Smoke tests before moving to next phase
- Sample documents for regression testing

## 📝 License

This is an educational project for learning RAG concepts.

## 🙏 Acknowledgments

Built as a learning tool for understanding RAG pipeline components and optimization.

## 📮 Feedback

This is a phased development project. After testing Phase 1, we'll move to Phase 2 (chunking strategies) when you're ready!

---

**Current Version:** 1.0.0 (Phase 1)
**Last Updated:** 2025-01-12
**Status:** ✅ Ready for Testing
