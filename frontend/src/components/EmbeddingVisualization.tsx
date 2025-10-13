/**
 * EmbeddingVisualization Component
 * Phase 3: Display embedding statistics and metadata
 */

import { Activity, Database, BarChart3, Zap } from 'lucide-react';
import type { EmbeddingResponse } from '../types';

interface EmbeddingVisualizationProps {
  result: EmbeddingResponse | null;
}

export const EmbeddingVisualization: React.FC<EmbeddingVisualizationProps> = ({ result }) => {
  if (!result) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="text-center py-8">
          <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">
            Generate embeddings to see visualization
          </p>
        </div>
      </div>
    );
  }

  const { statistics, preview, model_type, model_name } = result;

  // Format model name for display
  const displayModelName = model_type === 'tfidf' ? 'TF-IDF' : 'Sentence Transformer';

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center gap-3 mb-4">
        <Activity className="w-6 h-6 text-green-500" />
        <h2 className="text-xl font-semibold text-green-400">
          Embedding Results
        </h2>
      </div>

      {/* Model Info */}
      <div className="mb-4 bg-gray-900 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-400">Model</div>
            <div className="text-lg font-semibold text-primary-300">{displayModelName}</div>
            <div className="text-xs text-gray-500">{model_name}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Embeddings Generated</div>
            <div className="text-2xl font-bold text-green-400">{statistics.total_embeddings}</div>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {/* Dimension */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-400">Dimension</span>
          </div>
          <div className="text-xl font-bold text-blue-300">{statistics.dimension}</div>
        </div>

        {/* Total Size */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Database className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-gray-400">Total Size</span>
          </div>
          <div className="text-xl font-bold text-purple-300">{statistics.total_size_mb} MB</div>
        </div>

        {/* Avg Size */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Database className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-gray-400">Avg/Chunk</span>
          </div>
          <div className="text-xl font-bold text-cyan-300">{statistics.avg_size_kb} KB</div>
        </div>

        {/* Model-specific stat */}
        {model_type === 'tfidf' && statistics.avg_sparsity !== undefined && (
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-gray-400">Sparsity</span>
            </div>
            <div className="text-xl font-bold text-yellow-300">
              {(statistics.avg_sparsity * 100).toFixed(1)}%
            </div>
          </div>
        )}

        {model_type === 'sentence_transformer' && statistics.avg_l2_norm !== undefined && (
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-gray-400">Avg L2 Norm</span>
            </div>
            <div className="text-xl font-bold text-yellow-300">
              {statistics.avg_l2_norm?.toFixed(3)}
            </div>
          </div>
        )}
      </div>

      {/* TF-IDF Specific Stats */}
      {model_type === 'tfidf' && statistics.avg_non_zero_features !== undefined && (
        <div className="mb-4 bg-gray-900 border border-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">TF-IDF Details</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-400">Vocabulary Size</div>
              <div className="text-lg font-semibold text-gray-200">{statistics.dimension}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Avg Active Features</div>
              <div className="text-lg font-semibold text-gray-200">
                {statistics.avg_non_zero_features?.toFixed(1)}
              </div>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            Sparse vectors use only {((1 - (statistics.avg_sparsity || 0)) * 100).toFixed(1)}% of
            available features on average
          </div>
        </div>
      )}

      {/* Preview Embeddings */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">
          Sample Embeddings ({preview.length})
        </h3>
        <div className="space-y-2">
          {preview.map((emb, idx) => (
            <div key={emb.embedding_id} className="bg-gray-800 border border-gray-700 rounded p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Embedding {idx + 1}</span>
                <span className="text-xs font-mono text-gray-500">
                  {emb.dimension}D
                </span>
              </div>

              {model_type === 'tfidf' && emb.metadata.non_zero_features !== undefined && (
                <div className="text-xs text-gray-400">
                  {emb.metadata.non_zero_features} active features
                  ({((emb.metadata.non_zero_features / emb.dimension) * 100).toFixed(1)}% dense)
                </div>
              )}

              {model_type === 'sentence_transformer' && emb.metadata.l2_norm !== undefined && (
                <div className="text-xs text-gray-400">
                  L2 norm: {emb.metadata.l2_norm.toFixed(3)} |
                  Mean: {emb.metadata.mean?.toFixed(3)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-4 bg-green-900/10 border border-green-800/30 rounded-lg p-3">
        <p className="text-green-300 text-xs leading-relaxed">
          <strong>✓ Success:</strong> Embeddings generated successfully! These vector
          representations can now be used for semantic search and similarity matching.
          {model_type === 'tfidf' && ' TF-IDF embeddings are optimized for keyword-based retrieval.'}
          {model_type === 'sentence_transformer' && ' Dense embeddings capture semantic meaning and work well for paraphrased queries.'}
        </p>
      </div>
    </div>
  );
};
