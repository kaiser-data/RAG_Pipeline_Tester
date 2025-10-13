/**
 * ChunkPreview Component
 * Phase 2: Display chunks with statistics
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, BarChart3, Hash } from 'lucide-react';
import type { Chunk, ChunkStatistics } from '../types';

interface ChunkPreviewProps {
  chunks: Chunk[];
  statistics: ChunkStatistics | null;
  totalChunks: number;
}

export const ChunkPreview: React.FC<ChunkPreviewProps> = ({
  chunks,
  statistics,
  totalChunks,
}) => {
  const [expandedChunks, setExpandedChunks] = useState<Set<string>>(new Set());

  const toggleChunk = (chunkId: string) => {
    setExpandedChunks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(chunkId)) {
        newSet.delete(chunkId);
      } else {
        newSet.add(chunkId);
      }
      return newSet;
    });
  };

  if (chunks.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-primary-400">Chunk Preview</h2>
        <div className="text-center py-12 text-gray-400">
          <Hash className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No chunks generated yet</p>
          <p className="text-sm mt-2">Configure chunking settings and generate chunks</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-primary-400">Chunk Preview</h2>
        <div className="text-sm text-gray-400">
          Showing {chunks.length} of {totalChunks} chunks
        </div>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="mb-6 p-4 bg-gray-900 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-5 h-5 text-primary-500" />
            <h3 className="font-medium text-gray-200">Statistics</h3>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <div className="text-xs text-gray-400 mb-1">Total Chunks</div>
              <div className="text-lg font-semibold text-gray-100">
                {statistics.total_chunks}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Avg Size</div>
              <div className="text-lg font-semibold text-gray-100">
                {statistics.avg_chunk_size} chars
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Total Tokens</div>
              <div className="text-lg font-semibold text-gray-100">
                ~{statistics.total_tokens}
              </div>
            </div>
          </div>

          {/* Size Distribution */}
          {statistics.chunk_size_distribution && (
            <div>
              <div className="text-xs text-gray-400 mb-2">Size Distribution</div>
              <div className="flex gap-2 items-end h-12">
                <div className="flex-1 bg-green-600 rounded-t" style={{
                  height: `${(statistics.chunk_size_distribution.small / statistics.total_chunks) * 100}%`,
                  minHeight: '8px'
                }}>
                  <div className="text-xs text-center text-white pt-1">
                    {statistics.chunk_size_distribution.small > 0 && statistics.chunk_size_distribution.small}
                  </div>
                </div>
                <div className="flex-1 bg-blue-600 rounded-t" style={{
                  height: `${(statistics.chunk_size_distribution.medium / statistics.total_chunks) * 100}%`,
                  minHeight: '8px'
                }}>
                  <div className="text-xs text-center text-white pt-1">
                    {statistics.chunk_size_distribution.medium > 0 && statistics.chunk_size_distribution.medium}
                  </div>
                </div>
                <div className="flex-1 bg-purple-600 rounded-t" style={{
                  height: `${(statistics.chunk_size_distribution.large / statistics.total_chunks) * 100}%`,
                  minHeight: '8px'
                }}>
                  <div className="text-xs text-center text-white pt-1">
                    {statistics.chunk_size_distribution.large > 0 && statistics.chunk_size_distribution.large}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-1">
                <div className="flex-1 text-xs text-center text-gray-400">Small</div>
                <div className="flex-1 text-xs text-center text-gray-400">Medium</div>
                <div className="flex-1 text-xs text-center text-gray-400">Large</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chunk List */}
      <div className="space-y-3">
        {chunks.map((chunk) => {
          const isExpanded = expandedChunks.has(chunk.chunk_id);

          return (
            <div
              key={chunk.chunk_id}
              className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden"
            >
              {/* Chunk Header */}
              <button
                onClick={() => toggleChunk(chunk.chunk_id)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-primary-500" />
                    <span className="font-mono text-sm text-gray-300">
                      Chunk {chunk.chunk_index + 1}
                    </span>
                  </div>
                  <div className="flex gap-3 text-xs text-gray-400">
                    <span>{chunk.char_count} chars</span>
                    <span>~{chunk.estimated_tokens} tokens</span>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {/* Chunk Content */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-700">
                  <div className="mt-3 p-3 bg-gray-950 rounded text-sm text-gray-300 font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">
                    {chunk.text}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {chunks.length < totalChunks && (
        <div className="mt-4 text-center text-sm text-gray-400">
          Showing preview of first {chunks.length} chunks.
          {totalChunks - chunks.length} more chunks available.
        </div>
      )}
    </div>
  );
};
