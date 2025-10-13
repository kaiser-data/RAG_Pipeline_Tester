/**
 * EmbeddingConfig Component
 * Phase 3: Configure embedding model and parameters
 */

import { useState } from 'react';
import { Sparkles, Loader2, Info } from 'lucide-react';
import { generateEmbeddings } from '../utils/api';
import type { EmbeddingResponse } from '../types';

interface EmbeddingConfigProps {
  documentId: string | null;
  hasChunks: boolean;
  onEmbeddingComplete: (result: EmbeddingResponse) => void;
}

export const EmbeddingConfig: React.FC<EmbeddingConfigProps> = ({
  documentId,
  hasChunks,
  onEmbeddingComplete,
}) => {
  const [modelType, setModelType] = useState<'tfidf' | 'sentence_transformer'>('tfidf');
  const [maxFeatures, setMaxFeatures] = useState(1000);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modelInfo: Record<string, { explanation: string; pros: string[]; cons: string[]; bestFor: string }> = {
    tfidf: {
      explanation: 'Term Frequency-Inverse Document Frequency creates sparse vectors based on word importance. Classic and efficient for keyword-based retrieval.',
      pros: [
        'Fast computation',
        'Low memory usage (sparse vectors)',
        'Good for keyword matching',
        'Interpretable features'
      ],
      cons: [
        'No semantic understanding',
        'Ignores word order',
        'Limited to vocabulary',
        'Poor for paraphrased queries'
      ],
      bestFor: 'Keyword search, large document collections, or when speed and simplicity are priorities'
    },
    sentence_transformer: {
      explanation: 'Dense neural embeddings that capture semantic meaning. Uses transformer models (like BERT) to understand context and relationships.',
      pros: [
        'Semantic understanding',
        'Handles synonyms and paraphrasing',
        'Better for complex queries',
        'Context-aware'
      ],
      cons: [
        'Slower computation',
        'Higher memory usage',
        'Requires model download',
        'Less interpretable'
      ],
      bestFor: 'Semantic search, question answering, or when understanding meaning is critical'
    }
  };

  const handleGenerate = async () => {
    if (!documentId || !hasChunks) {
      setError('Please upload a document and generate chunks first');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateEmbeddings({
        document_id: documentId,
        model_type: modelType,
        max_features: modelType === 'tfidf' ? maxFeatures : undefined,
        batch_size: modelType === 'sentence_transformer' ? 32 : undefined,
      });

      onEmbeddingComplete(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Embedding generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center gap-3 mb-4">
        <Sparkles className="w-6 h-6 text-primary-500" />
        <h2 className="text-xl font-semibold text-primary-400">
          Embedding Configuration
        </h2>
      </div>

      {!hasChunks && (
        <div className="mb-4 bg-yellow-900/20 border border-yellow-700 rounded-lg p-3">
          <p className="text-yellow-400 text-sm">
            Generate chunks first before creating embeddings
          </p>
        </div>
      )}

      <div className="space-y-6">
        {/* Model Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Embedding Model
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <button
              onClick={() => setModelType('tfidf')}
              disabled={isGenerating}
              className={`
                p-3 rounded-lg border-2 transition-all text-left
                ${
                  modelType === 'tfidf'
                    ? 'border-primary-500 bg-primary-900/20 text-primary-300'
                    : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                }
                ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="font-medium text-sm mb-0.5">TF-IDF</div>
              <div className="text-xs text-gray-400">Sparse, keyword-based</div>
            </button>

            <button
              onClick={() => setModelType('sentence_transformer')}
              disabled={isGenerating}
              className={`
                p-3 rounded-lg border-2 transition-all text-left
                ${
                  modelType === 'sentence_transformer'
                    ? 'border-primary-500 bg-primary-900/20 text-primary-300'
                    : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                }
                ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="font-medium text-sm mb-0.5">Sentence Transformer</div>
              <div className="text-xs text-gray-400">Dense, semantic understanding</div>
              <div className="text-xs text-yellow-500 mt-1">⚠️ Requires download</div>
            </button>
          </div>
        </div>

        {/* Model Information Panel */}
        {modelInfo[modelType] && (
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
            <div className="flex items-start gap-2 mb-2">
              <Info className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" />
              <h3 className="text-sm font-semibold text-primary-400">
                About {modelType === 'tfidf' ? 'TF-IDF' : 'Sentence Transformer'}
              </h3>
            </div>

            <p className="text-xs text-gray-300 mb-3 leading-relaxed">
              {modelInfo[modelType].explanation}
            </p>

            <div className="grid grid-cols-2 gap-3 mb-3">
              {/* Pros */}
              <div>
                <div className="text-xs font-medium text-green-400 mb-1.5">✓ Pros</div>
                <ul className="space-y-1">
                  {modelInfo[modelType].pros.map((pro, idx) => (
                    <li key={idx} className="text-xs text-gray-400 flex items-start">
                      <span className="text-green-500 mr-1">•</span>
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cons */}
              <div>
                <div className="text-xs font-medium text-orange-400 mb-1.5">⚠ Cons</div>
                <ul className="space-y-1">
                  {modelInfo[modelType].cons.map((con, idx) => (
                    <li key={idx} className="text-xs text-gray-400 flex items-start">
                      <span className="text-orange-500 mr-1">•</span>
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Best For */}
            <div className="pt-2 border-t border-gray-700">
              <div className="text-xs">
                <span className="font-medium text-blue-400">Best for: </span>
                <span className="text-gray-300">{modelInfo[modelType].bestFor}</span>
              </div>
            </div>
          </div>
        )}

        {/* TF-IDF Parameters */}
        {modelType === 'tfidf' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">
                Max Features (Vocabulary Size)
              </label>
              <span className="text-sm text-primary-400 font-mono">
                {maxFeatures}
              </span>
            </div>
            <input
              type="range"
              min="100"
              max="5000"
              step="100"
              value={maxFeatures}
              onChange={(e) => setMaxFeatures(Number(e.target.value))}
              disabled={isGenerating}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>100</span>
              <span>2500</span>
              <span>5000</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Higher values capture more vocabulary but increase memory usage.
              Typical range: 500-2000
            </p>
          </div>
        )}

        {/* Sentence Transformer Info */}
        {modelType === 'sentence_transformer' && (
          <div className="bg-blue-900/10 border border-blue-800/30 rounded-lg p-3">
            <p className="text-blue-300 text-xs leading-relaxed mb-2">
              <strong>Model:</strong> all-MiniLM-L6-v2 (384 dimensions)
            </p>
            <p className="text-blue-300 text-xs leading-relaxed">
              <strong>Note:</strong> First use requires downloading the model (~90MB).
              This may take a minute depending on your connection.
            </p>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={!documentId || !hasChunks || isGenerating}
          className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600
                   text-white rounded-lg font-medium transition-colors
                   flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating Embeddings...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Embeddings
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
            <strong>💡 Tip:</strong> TF-IDF is recommended for getting started.
            It's fast and works well for most use cases. Sentence Transformers provide
            better semantic understanding but require more resources.
          </p>
        </div>
      </div>
    </div>
  );
};
