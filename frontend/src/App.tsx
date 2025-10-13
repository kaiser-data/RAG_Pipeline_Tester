/**
 * Main App Component
 * Phase 1: Document upload and text viewing
 * Phase 2: Chunking strategies
 * Phase 3: Embeddings
 */

import { useState, useEffect } from 'react';
import { DocumentUpload } from './components/DocumentUpload';
import { DocumentList } from './components/DocumentList';
import { TextDisplay } from './components/TextDisplay';
import { MultiDocumentChunking } from './components/MultiDocumentChunking';
import { ChunkPreview } from './components/ChunkPreview';
import { EmbeddingConfig } from './components/EmbeddingConfig';
import { EmbeddingVisualization } from './components/EmbeddingVisualization';
import { VectorStoreSelector } from './components/VectorStoreSelector';
import { SearchInterface } from './components/SearchInterface';
import { SearchResults } from './components/SearchResults';
import { RAGQuery } from './components/RAGQuery';
import { RAGCompare } from './components/RAGCompare';
import { WorkflowStepper } from './components/WorkflowStepper';
import { StatusCard } from './components/StatusCard';
import { DatabaseManager } from './components/DatabaseManager';
import { getDocuments, getDocument, deleteDocument, type StoreVectorsResponse, type SearchResponse } from './utils/api';
import type { Document, ChunkResponse, EmbeddingResponse } from './types';
import { Loader2, Activity, ChevronLeft, ChevronRight } from 'lucide-react';

function App() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<Document[]>([]); // Support multiple selection
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chunkResults, setChunkResults] = useState<Map<string, ChunkResponse>>(new Map()); // Per-document chunks
  const [embeddingResult, setEmbeddingResult] = useState<EmbeddingResponse | null>(null);
  const [vectorStoreStatus, setVectorStoreStatus] = useState<Record<string, StoreVectorsResponse>>({});
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [activePhase, setActivePhase] = useState<number>(0); // 0: Upload, 1: Chunk, 2: Embed, 3: Store, 4: Search, 5: RAG Query

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const docs = await getDocuments();
      setDocuments(docs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
      console.error('Error loading documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentSelect = async (doc: Document) => {
    try {
      // Toggle selection for multi-select
      const isAlreadySelected = selectedDocs.some(d => d.id === doc.id);

      if (isAlreadySelected) {
        // Deselect
        setSelectedDocs(selectedDocs.filter(d => d.id !== doc.id));
      } else {
        // Fetch full document with text and add to selection
        const fullDoc = await getDocument(doc.id);
        setSelectedDocs([...selectedDocs, fullDoc]);
      }

      // Don't auto-advance - let user navigate when ready
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document');
      console.error('Error loading document:', err);
    }
  };

  const handleChunkingComplete = (documentId: string, result: ChunkResponse) => {
    // Store chunks per document
    setChunkResults(new Map(chunkResults).set(documentId, result));
    // Clear embeddings when new chunks are generated
    setEmbeddingResult(null);
    setError(null);
  };

  const handleEmbeddingComplete = (result: EmbeddingResponse) => {
    setEmbeddingResult(result);
    setError(null);
  };

  const handleVectorStoreComplete = (backend: 'chromadb' | 'faiss', response: StoreVectorsResponse) => {
    setVectorStoreStatus({
      ...vectorStoreStatus,
      [backend]: response,
    });
    setError(null);
  };

  const handleSearchComplete = (results: SearchResponse) => {
    setSearchResults(results);
    setError(null);
  };

  const handleDocumentDelete = async (docId: string) => {
    try {
      await deleteDocument(docId);
      setDocuments(documents.filter((d) => d.id !== docId));

      // Remove from selection if it was selected
      setSelectedDocs(selectedDocs.filter((d) => d.id !== docId));

      // Remove chunk results for this document
      const newChunkResults = new Map(chunkResults);
      newChunkResults.delete(docId);
      setChunkResults(newChunkResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
      console.error('Error deleting document:', err);
    }
  };

  const handleUploadSuccess = () => {
    loadDocuments();
  };

  // Calculate workflow progress
  const getCurrentStep = () => {
    if (selectedDocs.length === 0) return 0;
    if (chunkResults.size === 0) return 1;
    if (!embeddingResult) return 2;
    return 3;
  };

  const getCompletedSteps = () => {
    const completed = new Set<number>();
    if (selectedDocs.length > 0) completed.add(0);
    if (chunkResults.size > 0) completed.add(1);
    if (embeddingResult) completed.add(2);
    return completed;
  };

  // Navigation helpers
  const canNavigateToPhase = (phase: number) => {
    if (phase === 0) return true;
    if (phase === 1) return selectedDocs.length > 0;
    if (phase === 2) return selectedDocs.length > 0 && chunkResults.size > 0;
    if (phase === 3) return selectedDocs.length > 0 && chunkResults.size > 0 && !!embeddingResult;
    if (phase === 4) return selectedDocs.length > 0 && chunkResults.size > 0 && !!embeddingResult && Object.keys(vectorStoreStatus).length > 0;
    if (phase === 5) return selectedDocs.length > 0 && chunkResults.size > 0 && !!embeddingResult && Object.keys(vectorStoreStatus).length > 0;
    return false;
  };

  const handleNextPhase = () => {
    if (activePhase < 5 && canNavigateToPhase(activePhase + 1)) {
      setActivePhase(activePhase + 1);
    }
  };

  const handlePrevPhase = () => {
    if (activePhase > 0) {
      setActivePhase(activePhase - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-primary-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-100">
                RAG Pipeline Tester
              </h1>
              <p className="text-sm text-gray-400">
                Phase 6: LLM Integration & RAG Query
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-900/20 border border-green-700 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400 font-medium">Backend Connected</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6">
        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-700 rounded-lg p-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            <span className="ml-3 text-gray-400">Loading...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Sidebar - Workflow */}
            <div className="lg:col-span-2 space-y-6">
              <WorkflowStepper
                currentStep={getCurrentStep()}
                completedSteps={getCompletedSteps()}
                onStepClick={setActivePhase}
              />
              <StatusCard
                documents={selectedDocs}
                chunkResults={chunkResults}
                embeddingResult={embeddingResult}
              />
            </div>

            {/* Main Content */}
            <div className="lg:col-span-10">
              {/* Phase Content - Constrained width for consistency */}
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Phase 0: Document Upload */}
                {activePhase === 0 && (
                  <div className="space-y-6">
                    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                      <h2 className="text-xl font-semibold text-primary-400 mb-4">
                        Step 1: Upload Document
                      </h2>
                      <DocumentUpload onUploadSuccess={handleUploadSuccess} />
                    </div>

                    <DocumentList
                      documents={documents}
                      onDocumentSelect={handleDocumentSelect}
                      onDocumentDelete={handleDocumentDelete}
                      selectedDocIds={selectedDocs.map(d => d.id)}
                    />

                    {selectedDocs.length > 0 && (
                      <div className="space-y-4">
                        {selectedDocs.map(doc => (
                          <TextDisplay key={doc.id} document={doc} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Phase 1: Chunking */}
                {activePhase === 1 && (
                  <div className="space-y-6">
                    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                      <h2 className="text-xl font-semibold text-primary-400 mb-4">
                        Step 2: Chunk Documents
                      </h2>
                      <p className="text-sm text-gray-400 mb-4">
                        Selected: {selectedDocs.length} document{selectedDocs.length > 1 ? 's' : ''}
                      </p>
                    </div>

                    <MultiDocumentChunking
                      documents={selectedDocs}
                      onChunkingComplete={handleChunkingComplete}
                    />

                    {chunkResults.size > 0 && (
                      <div className="space-y-4">
                        {Array.from(chunkResults.entries()).map(([docId, result]) => {
                          const doc = selectedDocs.find(d => d.id === docId);
                          return (
                            <div key={docId} className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                              <h3 className="text-sm font-semibold text-gray-300 mb-3">
                                {doc?.filename || docId}
                              </h3>
                              <ChunkPreview
                                chunks={result.preview || []}
                                statistics={result.statistics || null}
                                totalChunks={result.total_chunks || 0}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Phase 2: Embeddings */}
                {activePhase === 2 && (
                  <div className="space-y-6">
                    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                      <h2 className="text-xl font-semibold text-primary-400 mb-4">
                        Step 3: Generate Embeddings
                      </h2>
                      <p className="text-sm text-gray-400 mb-4">
                        Documents with chunks: {chunkResults.size}
                      </p>
                      <EmbeddingConfig
                        documentId={selectedDocs[0]?.id || null}
                        hasChunks={chunkResults.size > 0}
                        onEmbeddingComplete={handleEmbeddingComplete}
                      />
                    </div>

                    {embeddingResult && (
                      <EmbeddingVisualization result={embeddingResult} />
                    )}
                  </div>
                )}

                {/* Phase 3: Vector Storage */}
                {activePhase === 3 && (
                  <div className="space-y-6">
                    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                      <h2 className="text-xl font-semibold text-primary-400 mb-4">
                        Step 4: Store Vectors
                      </h2>
                      <p className="text-sm text-gray-400 mb-4">
                        Store embeddings in vector database for fast similarity search
                      </p>
                    </div>

                    <VectorStoreSelector
                      documentId={selectedDocs[0]?.id || null}
                      hasEmbeddings={!!embeddingResult}
                      onStoreComplete={handleVectorStoreComplete}
                    />

                    {Object.keys(vectorStoreStatus).length > 0 && (
                      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                        <h3 className="text-sm font-semibold text-gray-300 mb-3">
                          Storage Status
                        </h3>
                        <div className="space-y-2">
                          {Object.entries(vectorStoreStatus).map(([backend, status]) => (
                            <div key={backend} className="flex items-center justify-between text-sm">
                              <span className="text-gray-300 capitalize">{backend}</span>
                              <span className="text-green-400">✓ {status.stored_count} vectors stored</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <DatabaseManager />
                  </div>
                )}

                {/* Phase 4: Search */}
                {activePhase === 4 && (
                  <div className="space-y-6">
                    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                      <h2 className="text-xl font-semibold text-primary-400 mb-4">
                        Step 5: Semantic Search
                      </h2>
                      <p className="text-sm text-gray-400 mb-2">
                        Test document retrieval with natural language queries
                      </p>
                    </div>

                    <SearchInterface onSearchComplete={handleSearchComplete} />

                    <SearchResults results={searchResults} />
                  </div>
                )}

                {/* Phase 5: Chat with Documents (LLM) */}
                {activePhase === 5 && (
                  <div className="space-y-6">
                    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                      <h2 className="text-xl font-semibold text-primary-400 mb-4">
                        Step 6: Chat with Documents
                      </h2>
                      <p className="text-sm text-gray-400 mb-2">
                        Ask questions and get AI-powered answers using LLM with your documents
                      </p>
                    </div>

                    {/* Tabs for Query vs Compare */}
                    <div className="bg-gray-800 rounded-lg border border-gray-700">
                      <div className="flex border-b border-gray-700">
                        <button
                          onClick={() => setError(null)}
                          className="flex-1 px-6 py-3 text-sm font-medium text-gray-300
                                   border-b-2 border-primary-500 bg-gray-900/50"
                        >
                          Single Query
                        </button>
                        <button
                          onClick={() => setError(null)}
                          className="flex-1 px-6 py-3 text-sm font-medium text-gray-400
                                   hover:text-gray-300 hover:bg-gray-900/30 transition-colors"
                        >
                          Compare Providers
                        </button>
                      </div>
                    </div>

                    <RAGQuery />
                    {/* Uncomment to enable comparison: <RAGCompare /> */}
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-4">
                  <button
                    onClick={handlePrevPhase}
                    disabled={activePhase === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600
                             disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed
                             text-gray-200 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Previous
                  </button>

                  <button
                    onClick={handleNextPhase}
                    disabled={!canNavigateToPhase(activePhase + 1) || activePhase === 5}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700
                             disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed
                             text-white rounded-lg transition-colors"
                  >
                    Next
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-gray-800 px-6 py-4 text-center text-sm text-gray-500">
        <p>
          RAG Pipeline Tester v6.0.0 | Phase 6: LLM Integration
        </p>
        <p className="mt-1">
          OpenAI | Anthropic | Ollama | RAG Query & Compare
        </p>
      </footer>
    </div>
  );
}

export default App;
