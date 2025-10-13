/**
 * Main App Component
 * Phase 1: Document upload and text viewing
 * Phase 2: Chunking strategies
 */

import { useState, useEffect } from 'react';
import { DocumentUpload } from './components/DocumentUpload';
import { DocumentList } from './components/DocumentList';
import { TextDisplay } from './components/TextDisplay';
import { ChunkingConfig } from './components/ChunkingConfig';
import { ChunkPreview } from './components/ChunkPreview';
import { getDocuments, getDocument, deleteDocument } from './utils/api';
import type { Document, ChunkResponse } from './types';
import { Loader2, Activity } from 'lucide-react';

function App() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chunkResult, setChunkResult] = useState<ChunkResponse | null>(null);

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
      // Fetch full document with text
      const fullDoc = await getDocument(doc.id);
      setSelectedDoc(fullDoc);
      // Clear chunks when selecting new document
      setChunkResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document');
      console.error('Error loading document:', err);
    }
  };

  const handleChunkingComplete = (result: ChunkResponse) => {
    setChunkResult(result);
    setError(null);
  };

  const handleDocumentDelete = async (docId: string) => {
    try {
      await deleteDocument(docId);
      setDocuments(documents.filter((d) => d.id !== docId));

      // Clear selection if deleted document was selected
      if (selectedDoc?.id === docId) {
        setSelectedDoc(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
      console.error('Error deleting document:', err);
    }
  };

  const handleUploadSuccess = () => {
    loadDocuments();
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
                Phase 2: Chunking Strategies
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <DocumentUpload onUploadSuccess={handleUploadSuccess} />
              <DocumentList
                documents={documents}
                onDocumentSelect={handleDocumentSelect}
                onDocumentDelete={handleDocumentDelete}
                selectedDocId={selectedDoc?.id}
              />
            </div>

            {/* Middle Column */}
            <div className="space-y-6">
              <TextDisplay document={selectedDoc} />
              <ChunkingConfig
                documentId={selectedDoc?.id || null}
                onChunkingComplete={handleChunkingComplete}
              />
            </div>

            {/* Right Column */}
            <div className="h-[calc(100vh-12rem)] sticky top-6 overflow-y-auto">
              <ChunkPreview
                chunks={chunkResult?.preview || []}
                statistics={chunkResult?.statistics || null}
                totalChunks={chunkResult?.total_chunks || 0}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-gray-800 px-6 py-4 text-center text-sm text-gray-500">
        <p>
          RAG Pipeline Tester v2.0.0 | Phase 2: Chunking Strategies
        </p>
        <p className="mt-1">
          Next: Phase 3 - Embeddings
        </p>
      </footer>
    </div>
  );
}

export default App;
