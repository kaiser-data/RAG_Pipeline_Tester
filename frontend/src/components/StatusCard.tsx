/**
 * StatusCard Component
 * Compact status display for current pipeline state
 */

import { FileText, Layers, Sparkles } from 'lucide-react';
import type { Document, ChunkResponse, EmbeddingResponse } from '../types';

interface StatusCardProps {
  documents: Document[];
  chunkResults: Map<string, ChunkResponse>;
  embeddingResult: EmbeddingResponse | null;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  documents,
  chunkResults,
  embeddingResult,
}) => {
  const totalChunks = Array.from(chunkResults.values()).reduce(
    (sum, result) => sum + result.total_chunks,
    0
  );

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Status
      </h3>

      <div className="space-y-2">
        {/* Documents */}
        <div className="flex items-center gap-2 text-xs">
          <FileText className={`w-4 h-4 ${documents.length > 0 ? 'text-green-500' : 'text-gray-600'}`} />
          <span className={documents.length > 0 ? 'text-gray-300' : 'text-gray-500'}>
            {documents.length > 0 ? `${documents.length} document${documents.length > 1 ? 's' : ''}` : 'No documents'}
          </span>
        </div>

        {/* Chunks */}
        <div className="flex items-center gap-2 text-xs">
          <Layers className={`w-4 h-4 ${totalChunks > 0 ? 'text-green-500' : 'text-gray-600'}`} />
          <span className={totalChunks > 0 ? 'text-gray-300' : 'text-gray-500'}>
            {totalChunks > 0 ? `${totalChunks} chunks` : 'No chunks'}
          </span>
        </div>

        {/* Embeddings */}
        <div className="flex items-center gap-2 text-xs">
          <Sparkles className={`w-4 h-4 ${embeddingResult ? 'text-green-500' : 'text-gray-600'}`} />
          <span className={embeddingResult ? 'text-gray-300' : 'text-gray-500'}>
            {embeddingResult ? `${embeddingResult.statistics.dimension}D vectors` : 'No embeddings'}
          </span>
        </div>
      </div>
    </div>
  );
};
