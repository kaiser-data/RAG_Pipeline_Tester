/**
 * MultiDocumentChunking Component
 * Chunk multiple documents with the same settings
 */

import { useState } from 'react';
import { Scissors, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { chunkDocument } from '../utils/api';
import type { Document, ChunkResponse } from '../types';

interface MultiDocumentChunkingProps {
  documents: Document[];
  onChunkingComplete: (documentId: string, result: ChunkResponse) => void;
}

export const MultiDocumentChunking: React.FC<MultiDocumentChunkingProps> = ({
  documents,
  onChunkingComplete,
}) => {
  const [strategy, setStrategy] = useState<'fixed' | 'recursive' | 'sentence' | 'semantic' | 'sliding_window'>('fixed');
  const [chunkSize, setChunkSize] = useState(500);
  const [overlap, setOverlap] = useState(50);
  const [isChunking, setIsChunking] = useState(false);
  const [chunkingStatus, setChunkingStatus] = useState<Map<string, 'pending' | 'processing' | 'success' | 'error'>>(new Map());
  const [error, setError] = useState<string | null>(null);

  const strategies = [
    {
      id: 'fixed',
      name: 'Fixed-Size',
      desc: 'Regular intervals',
      pros: 'Simple, fast, predictable size',
      cons: 'May break mid-sentence or thought'
    },
    {
      id: 'recursive',
      name: 'Recursive',
      desc: 'Respects document structure',
      pros: 'Preserves paragraphs & structure',
      cons: 'Variable chunk sizes'
    },
    {
      id: 'sentence',
      name: 'Sentence',
      desc: 'Complete sentences only',
      pros: 'Never breaks sentences',
      cons: 'Chunk sizes can vary significantly'
    },
    {
      id: 'semantic',
      name: 'Semantic',
      desc: 'Groups related content',
      pros: 'Keeps related topics together',
      cons: 'Slower, needs good keyword overlap'
    },
    {
      id: 'sliding_window',
      name: 'Sliding Window',
      desc: 'Overlapping fixed windows',
      pros: 'Consistent overlap, no info loss',
      cons: 'More chunks, higher storage'
    },
  ] as const;

  const handleChunkAll = async () => {
    if (documents.length === 0) {
      setError('Please select at least one document');
      return;
    }

    setIsChunking(true);
    setError(null);

    // Initialize status for all documents
    const status = new Map<string, 'pending' | 'processing' | 'success' | 'error'>();
    documents.forEach(doc => status.set(doc.id, 'pending'));
    setChunkingStatus(status);

    // Process documents sequentially
    for (const doc of documents) {
      try {
        status.set(doc.id, 'processing');
        setChunkingStatus(new Map(status));

        const result = await chunkDocument({
          document_id: doc.id,
          strategy,
          chunk_size: chunkSize,
          overlap,
        });

        status.set(doc.id, 'success');
        setChunkingStatus(new Map(status));
        onChunkingComplete(doc.id, result);
      } catch (err) {
        status.set(doc.id, 'error');
        setChunkingStatus(new Map(status));
        console.error(`Error chunking document ${doc.id}:`, err);
      }
    }

    setIsChunking(false);
  };

  const getStatusIcon = (docId: string) => {
    const status = chunkingStatus.get(docId);
    if (status === 'success') return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (status === 'error') return <XCircle className="w-4 h-4 text-red-500" />;
    if (status === 'processing') return <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />;
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <Scissors className="w-6 h-6 text-primary-500" />
          <h2 className="text-xl font-semibold text-primary-400">
            Chunking Configuration
          </h2>
        </div>

        {documents.length === 0 && (
          <div className="mb-4 bg-yellow-900/20 border border-yellow-700 rounded-lg p-3">
            <p className="text-yellow-400 text-sm">
              Select documents to configure chunking
            </p>
          </div>
        )}

        <div className="space-y-6">
          {/* Strategy Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Chunking Strategy
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {strategies.map((strat) => (
                <button
                  key={strat.id}
                  onClick={() => setStrategy(strat.id as any)}
                  disabled={isChunking}
                  className={`
                    p-3 rounded-lg border-2 transition-all text-left
                    ${
                      strategy === strat.id
                        ? 'border-primary-500 bg-primary-900/20 text-primary-300'
                        : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                    }
                    ${isChunking ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <div className="font-semibold text-sm mb-1">{strat.name}</div>
                  <div className="text-xs text-gray-400 mb-2">{strat.desc}</div>
                  <div className="space-y-1">
                    <div className="flex items-start gap-1">
                      <span className="text-green-400 text-xs mt-0.5">✓</span>
                      <span className="text-xs text-gray-400">{strat.pros}</span>
                    </div>
                    <div className="flex items-start gap-1">
                      <span className="text-red-400 text-xs mt-0.5">✗</span>
                      <span className="text-xs text-gray-400">{strat.cons}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chunk Size Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">
                Chunk Size
              </label>
              <span className="text-sm text-primary-400 font-mono">
                {chunkSize} chars
              </span>
            </div>
            <input
              type="range"
              min="100"
              max="2000"
              step="50"
              value={chunkSize}
              onChange={(e) => setChunkSize(Number(e.target.value))}
              disabled={isChunking}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>100</span>
              <span>1000</span>
              <span>2000</span>
            </div>
          </div>

          {/* Overlap Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">
                Overlap
              </label>
              <span className="text-sm text-primary-400 font-mono">
                {overlap} chars
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="500"
              step="10"
              value={overlap}
              onChange={(e) => setOverlap(Number(e.target.value))}
              disabled={isChunking}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0</span>
              <span>250</span>
              <span>500</span>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleChunkAll}
            disabled={documents.length === 0 || isChunking}
            className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600
                     text-white rounded-lg font-medium transition-colors
                     flex items-center justify-center gap-2"
          >
            {isChunking ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Chunking {documents.length} document{documents.length > 1 ? 's' : ''}...
              </>
            ) : (
              <>
                <Scissors className="w-5 h-5" />
                Generate Chunks for {documents.length} Document{documents.length > 1 ? 's' : ''}
              </>
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Chunking Progress */}
      {chunkingStatus.size > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">
            Processing Progress
          </h3>
          <div className="space-y-2">
            {documents.map(doc => (
              <div key={doc.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-300 truncate flex-1">{doc.filename}</span>
                <div className="ml-2">{getStatusIcon(doc.id)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
