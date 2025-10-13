# RAG Pipeline Tester

A full-stack web application for testing and tuning RAG (Retrieval-Augmented Generation) pipelines. Experiment with different extraction methods, chunking strategies, embedding models, and vector search configurations.

## 🎯 Project Status

**Current Phase: Phase 4 - Vector Storage & Search** ✅

This is an iterative project built in phases. Each phase adds new functionality while maintaining stability.

### Completed Phases

- ✅ **Phase 1**: Document upload and text extraction (.txt, .md files)
- ✅ **Phase 2**: Chunking strategies (Fixed-size, Recursive, Sentence, Semantic, Sliding Window)
- ✅ **Phase 3**: Embedding generation (TF-IDF, Sentence Transformers)
- ✅ **Phase 4**: Vector storage (ChromaDB, FAISS) and semantic search

### Roadmap

- 📋 **Phase 5**: Enhanced extraction (PDF, DOCX support) and advanced chunking
- 📋 **Phase 6**: RAG integration with LLM (OpenAI, Anthropic, Local models)
- 📋 **Phase 7**: Comparison tools and analytics dashboard
- 📋 **Phase 8**: Production features and deployment

## 🏗️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Python 3.12+** - Core language
- **ChromaDB** - Persistent vector database
- **FAISS** - Fast similarity search library
- **Sentence Transformers** - Dense embeddings (all-MiniLM-L6-v2)
- **scikit-learn** - TF-IDF sparse embeddings
- **NLTK** - Natural language processing

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## 📦 Installation

### Prerequisites
- Python 3.12 or higher
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

4. Download NLTK data (first time only):
```python
python -c "import nltk; nltk.download('punkt')"
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
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

API documentation (Swagger UI): `http://localhost:8000/docs`

### Start Frontend

From the `frontend` directory:

```bash
npm run dev
```

The UI will be available at `http://localhost:5173`

## 📖 Complete Usage Guide

### 5-Phase RAG Pipeline Workflow

#### Phase 1: Upload Documents

1. **Click "Select File"** or drag-and-drop
2. **Choose a .txt or .md file** (up to 10MB)
3. **View the document** in the list
4. **Select multiple documents** for batch processing

#### Phase 2: Chunk Documents

1. **Select chunking strategy**:
   - **Fixed Size**: Equal-sized chunks with overlap
   - **Recursive**: Respects document structure (paragraphs, sentences)
   - **Sentence**: Natural sentence boundaries
   - **Semantic**: AI-powered semantic segmentation
   - **Sliding Window**: Overlapping windows for context

2. **Configure parameters**:
   - **Chunk Size**: 200-2000 characters
   - **Overlap**: 0-500 characters
   - **Stride**: For sliding window strategy

3. **Click "Generate Chunks"** and view statistics

#### Phase 3: Generate Embeddings

1. **Select embedding model**:
   - **TF-IDF**: Fast, sparse embeddings (1000-5000 features)
   - **Sentence Transformers**: Dense semantic embeddings (384 dimensions)

2. **Configure model**:
   - TF-IDF: Max features, ngram range
   - Sentence Transformers: Model name, batch size

3. **Click "Generate Embeddings"** and view statistics

#### Phase 4: Store Vectors

1. **Select vector database**:
   - **ChromaDB**: Persistent storage, full-featured
   - **FAISS**: Fast in-memory search, optimized

2. **Configure collection**:
   - Collection name for organization
   - Automatic indexing

3. **Click "Store Vectors"** and verify storage

#### Phase 5: Semantic Search

1. **Enter natural language query**:
   - Example: "What is machine learning?"
   - Example: "Explain neural networks"

2. **Configure search**:
   - **Top K**: Number of results (1-20)
   - **Collection**: Target collection name
   - **Backend**: ChromaDB or FAISS

3. **View search results** with similarity scores

### Workflow Navigation

- **Stepper**: Shows current phase and completion status
- **Next/Previous**: Navigate between phases
- **Status Card**: Real-time progress summary
- **Multi-Document**: Process multiple documents in parallel

## 🧪 Testing the Complete Pipeline

### Quick Test

1. Upload `sample_docs/sample_text.txt`
2. Chunk with "Fixed Size" (500 chars, 50 overlap)
3. Generate embeddings with "Sentence Transformers"
4. Store in "ChromaDB" collection
5. Search for "What is this document about?"

### Sample Queries

For a Moby Dick document:
- "What is the color of Moby Dick?"
- "Who is Captain Ahab?"
- "Describe the whaling voyage"

## 📁 Project Structure

```
RAG_compare/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application & all endpoints
│   │   ├── models.py            # Pydantic models
│   │   ├── storage.py           # In-memory storage
│   │   ├── chunker.py           # Chunking strategies
│   │   ├── embedder.py          # Embedding generation
│   │   ├── vector_store.py      # ChromaDB & FAISS adapters
│   │   └── __init__.py
│   ├── chroma_db/               # ChromaDB persistent storage
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DocumentUpload.tsx
│   │   │   ├── DocumentList.tsx
│   │   │   ├── TextDisplay.tsx
│   │   │   ├── MultiDocumentChunking.tsx
│   │   │   ├── ChunkPreview.tsx
│   │   │   ├── EmbeddingConfig.tsx
│   │   │   ├── EmbeddingVisualization.tsx
│   │   │   ├── VectorStoreSelector.tsx
│   │   │   ├── SearchInterface.tsx
│   │   │   ├── SearchResults.tsx
│   │   │   ├── WorkflowStepper.tsx
│   │   │   └── StatusCard.tsx
│   │   ├── utils/
│   │   │   └── api.ts           # API client with all endpoints
│   │   ├── types/
│   │   │   └── index.ts         # TypeScript types
│   │   ├── App.tsx              # Main app with 5-phase workflow
│   │   ├── main.tsx             # Entry point
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── uploads/                      # Uploaded files (created automatically)
├── sample_docs/                 # Sample documents for testing
└── README.md
```

## 🔧 API Endpoints

### Phase 1: Document Management

```
POST   /api/upload              # Upload document
GET    /api/documents            # List all documents
GET    /api/documents/{id}       # Get document with text
DELETE /api/documents/{id}       # Delete document
GET    /api/health               # Health check
```

### Phase 2: Chunking

```
POST   /api/chunk                # Chunk document
GET    /api/documents/{id}/chunks # Get chunks for document
```

### Phase 3: Embeddings

```
POST   /api/embed                 # Generate embeddings
GET    /api/documents/{id}/embeddings # Get embeddings
```

### Phase 4: Vector Storage & Search

```
POST   /api/store                 # Store vectors in database
POST   /api/search                # Semantic similarity search
GET    /api/collections           # List collections
GET    /api/collections/{name}/stats # Collection statistics
DELETE /api/collections/{name}    # Delete collection
```

## 🔍 Next Steps: LLM Integration (Phase 6)

### Integration Options

#### 1. OpenAI Integration
```python
# Add to requirements.txt
openai>=1.0.0

# Environment variables
OPENAI_API_KEY=your_key_here
```

**Implementation**:
- Create `app/llm_providers/openai_provider.py`
- Add `/api/query` endpoint for RAG queries
- Use search results as context for LLM
- Stream responses back to frontend

#### 2. Anthropic Claude Integration
```python
# Add to requirements.txt
anthropic>=0.25.0

# Environment variables
ANTHROPIC_API_KEY=your_key_here
```

**Implementation**:
- Create `app/llm_providers/anthropic_provider.py`
- Support Claude 3 Opus/Sonnet/Haiku models
- Implement prompt templates for RAG
- Add conversation history support

#### 3. Local LLM Integration (Ollama)
```python
# Add to requirements.txt
ollama>=0.1.0

# No API key needed - fully local
```

**Models to try**:
- `llama3.2` - Meta's latest
- `mistral` - Fast and capable
- `phi3` - Microsoft's small model

**Implementation**:
- Create `app/llm_providers/ollama_provider.py`
- Add model selection dropdown
- Support streaming responses
- Local privacy - no data leaves your machine

#### 4. LangChain Integration (Recommended)
```python
# Add to requirements.txt
langchain>=0.1.0
langchain-openai>=0.1.0
langchain-anthropic>=0.1.0
langchain-ollama>=0.1.0
```

**Benefits**:
- Unified interface for all LLMs
- Built-in prompt templates
- Memory and conversation management
- Tool calling and agents support

**Implementation**:
```python
from langchain.chains import RetrievalQA
from langchain.vectorstores import Chroma, FAISS
from langchain.embeddings import SentenceTransformerEmbeddings

# Create retrieval chain
retriever = vectorstore.as_retriever(search_kwargs={"k": 5})
qa_chain = RetrievalQA.from_chain_type(
    llm=selected_llm,
    retriever=retriever,
    return_source_documents=True
)

# Query with context
response = qa_chain({"query": user_question})
```

### Recommended Architecture for Phase 6

```python
# app/llm.py
class LLMProvider(ABC):
    @abstractmethod
    async def generate(self, prompt: str, context: List[str]) -> str:
        pass

class OpenAIProvider(LLMProvider):
    # Implementation for OpenAI

class AnthropicProvider(LLMProvider):
    # Implementation for Anthropic

class OllamaProvider(LLMProvider):
    # Implementation for Ollama

# app/rag.py
class RAGEngine:
    def __init__(self, vector_store, llm_provider):
        self.vector_store = vector_store
        self.llm_provider = llm_provider

    async def query(self, question: str, top_k: int = 5):
        # 1. Search for relevant chunks
        results = self.vector_store.search(question, top_k)

        # 2. Build context from results
        context = [r["text"] for r in results]

        # 3. Create prompt with context
        prompt = self.build_prompt(question, context)

        # 4. Generate answer with LLM
        answer = await self.llm_provider.generate(prompt, context)

        # 5. Return answer with sources
        return {
            "answer": answer,
            "sources": results,
            "model": self.llm_provider.name
        }
```

### Frontend Integration (Phase 6)

Create new components:
- `RAGQueryInterface.tsx` - Question input with model selection
- `RAGResponse.tsx` - Answer display with source citations
- `ConversationHistory.tsx` - Chat-like interface
- `ModelSelector.tsx` - Choose LLM provider and model

### Testing RAG Integration

Sample queries to test:
1. **Factual**: "What are the main characters in this document?"
2. **Analytical**: "Summarize the key themes"
3. **Comparative**: "Compare the first and last chapters"
4. **Open-ended**: "What can we learn from this text?"

## 🐛 Troubleshooting

### Backend Issues

**ImportError: cannot import name 'cached_download'**
- Solution: Update sentence-transformers to >=5.0.0

**ChromaDB errors**
- Delete `chroma_db/` folder and restart
- Check file permissions

**FAISS dimension mismatch**
- Regenerate embeddings with consistent model
- Clear FAISS indexes

### Frontend Issues

**Search returns no results**
- Verify vectors were stored successfully
- Check collection name matches
- Ensure embeddings were generated

**Workflow stuck on a phase**
- Check browser console for errors
- Verify backend is responding
- Refresh the page to reset state

## 📊 Performance

### Current Metrics

- Document upload: < 500ms
- Chunking: < 2s for 50 chunks
- TF-IDF embeddings: < 1s for 50 chunks
- Sentence Transformer embeddings: 2-5s for 50 chunks
- Vector storage: < 1s for 50 vectors
- Semantic search: < 100ms

### Limits

- Max file size: 10MB
- Supported formats: .txt, .md (Phase 1-4)
- Concurrent users: Single-user development tool
- Vector storage: Limited by available memory

## 🔒 Security Notes

**⚠️ Development Only**

This is a development tool, not production-ready:
- No authentication or authorization
- Files stored in plain text
- In-memory storage (resets on restart)
- ChromaDB persistent storage in local files
- CORS enabled for localhost only
- No input sanitization beyond file type

**For Production**:
- Add user authentication (JWT, OAuth)
- Implement file encryption at rest
- Use persistent database (PostgreSQL)
- Add rate limiting and API keys
- Implement proper input validation
- Set up logging and monitoring

## 🎨 UI Features

### Dark Theme
- Modern dark mode optimized for long sessions
- Purple/blue accent colors
- Color-coded status indicators and similarity scores

### 5-Phase Workflow
- Visual stepper showing progress
- Phase-based navigation with completion tracking
- Status card with real-time summary
- Next/Previous buttons with smart enablement

### Responsive Components
- Multi-document selection
- Parallel chunking for multiple documents
- Real-time embedding statistics
- Interactive search with similarity scores

## 🚧 Development Roadmap

### Phase 5: Enhanced Extraction (Planned)
- PDF document support (PyPDF2, pdfplumber)
- DOCX document support (python-docx)
- Advanced chunking (by topic, by section)
- Image extraction from PDFs

### Phase 6: LLM Integration (Planned)
- OpenAI GPT-4/3.5 integration
- Anthropic Claude integration
- Local LLM support (Ollama)
- LangChain framework integration
- Conversation memory
- Source citations

### Phase 7: Analytics Dashboard (Planned)
- Compare chunking strategies
- Compare embedding models
- Visualize semantic clusters
- Performance benchmarks
- Cost analysis for different LLMs

### Phase 8: Production Features (Planned)
- User authentication
- API key management
- Usage analytics
- Export/import configurations
- Batch processing
- Docker deployment

## 🤝 Contributing

This is an educational project demonstrating RAG pipeline concepts. Feel free to:
- Test different chunking strategies
- Experiment with embedding models
- Try different vector databases
- Integrate your favorite LLM

## 📝 License

This is an educational project for learning RAG concepts.

## 🙏 Acknowledgments

- **LangChain** - RAG framework inspiration
- **ChromaDB** - Vector database
- **FAISS** - Similarity search
- **Sentence Transformers** - Embedding models
- **FastAPI** - Backend framework
- **React** - Frontend framework

## 📮 Feedback

Phase 4 is complete with full vector storage and semantic search! Ready to integrate LLMs in Phase 6.

---

**Current Version:** 4.0.0 (Phase 4 Complete)
**Last Updated:** 2025-10-13
**Status:** ✅ Production-Ready for RAG Testing
