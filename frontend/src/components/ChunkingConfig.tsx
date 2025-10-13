/**
 * ChunkingConfig Component
 * Phase 2: Configure chunking strategy and parameters
 */

import { useState } from 'react';
import { Scissors, Loader2, Settings } from 'lucide-react';
import { chunkDocument } from '../utils/api';
import type { ChunkResponse } from '../types';

interface ChunkingConfigProps {
  documentId: string | null;
  onChunkingComplete: (result: ChunkResponse) => void;
}

export const ChunkingConfig: React.FC<ChunkingConfigProps> = ({
  documentId,
  onChunkingComplete,
}) => {
  const [strategy, setStrategy] = useState<'fixed' | 'recursive'>('fixed');
  const [chunkSize, setChunkSize] = useState(500);
  const [overlap, setOverlap] = useState(50);
  const [isChunking, setIsChunking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChunk = async () => {
    if (!documentId) {
      setError('Please select a document first');
      return;
    }

    setIsChunking(true);
    setError(null);

    try {
      const result = await chunkDocument({
        document_id: documentId,
        strategy,
        chunk_size: chunkSize,
        overlap,
      });

      onChunkingComplete(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chunking failed');
    } finally {
      setIsChunking(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center gap-3 mb-4">
        <Scissors className="w-6 h-6 text-primary-500" />
        <h2 className="text-xl font-semibold text-primary-400">
          Chunking Configuration
        </h2>
      </div>

      {!documentId && (
        <div className="mb-4 bg-yellow-900/20 border border-yellow-700 rounded-lg p-3">
          <p className="text-yellow-400 text-sm">
            Select a document to configure chunking
          </p>
        </div>
      )}

      <div className="space-y-6">
        {/* Strategy Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Chunking Strategy
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setStrategy('fixed')}
              disabled={isChunking}
              className={`
                p-3 rounded-lg border-2 transition-all text-left
                ${
                  strategy === 'fixed'
                    ? 'border-primary-500 bg-primary-900/20 text-primary-300'
                    : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                }
                ${isChunking ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="font-medium mb-1">Fixed-Size</div>
              <div className="text-xs text-gray-400">
                Split at regular intervals
              </div>
            </button>

            <button
              onClick={() => setStrategy('recursive')}
              disabled={isChunking}
              className={`
                p-3 rounded-lg border-2 transition-all text-left
                ${
                  strategy === 'recursive'
                    ? 'border-primary-500 bg-primary-900/20 text-primary-300'
                    : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                }
                ${isChunking ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="font-medium mb-1">Recursive</div>
              <div className="text-xs text-gray-400">
                Respect structure
              </div>
            </button>
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
          onClick={handleChunk}
          disabled={!documentId || isChunking}
          className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600
                   text-white rounded-lg font-medium transition-colors
                   flex items-center justify-center gap-2"
        >
          {isChunking ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Chunking...
            </>
          ) : (
            <>
              <Scissors className="w-5 h-5" />
              Generate Chunks
            </>
          )}
        </button>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Help Text */}
        <div className="bg-blue-900/10 border border-blue-800/30 rounded-lg p-3">
          <p className="text-blue-300 text-xs leading-relaxed">
            <strong>Tip:</strong> Smaller chunks provide precise retrieval but may lack context.
            Larger chunks include more context but can be less focused. Overlap helps prevent
            information loss at chunk boundaries.
          </p>
        </div>
      </div>
    </div>
  );
};
