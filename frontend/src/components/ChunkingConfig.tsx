/**
 * ChunkingConfig Component
 * Phase 2: Configure chunking strategy and parameters
 */

import { useState } from 'react';
import { Scissors, Loader2 } from 'lucide-react';
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
  const [strategy, setStrategy] = useState<'fixed' | 'recursive' | 'sentence' | 'semantic' | 'sliding_window'>('fixed');
  const [chunkSize, setChunkSize] = useState(500);
  const [overlap, setOverlap] = useState(50);
  const [isChunking, setIsChunking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strategies = [
    { id: 'fixed', name: 'Fixed-Size', desc: 'Regular intervals' },
    { id: 'recursive', name: 'Recursive', desc: 'Respect structure' },
    { id: 'sentence', name: 'Sentence', desc: 'Sentence boundaries' },
    { id: 'semantic', name: 'Semantic', desc: 'Topic similarity' },
    { id: 'sliding_window', name: 'Sliding Window', desc: 'Overlapping windows' },
  ] as const;

  const strategyInfo: Record<string, { explanation: string; pros: string[]; cons: string[]; bestFor: string }> = {
    fixed: {
      explanation: 'Splits text at regular character intervals with configurable overlap. Simple and predictable, but may break sentences or paragraphs mid-way.',
      pros: [
        'Consistent chunk sizes',
        'Predictable token counts',
        'Fast processing',
        'Works well with any text'
      ],
      cons: [
        'May break sentences or words',
        'Ignores document structure',
        'Context boundaries can be awkward'
      ],
      bestFor: 'Technical documents, logs, or when consistent chunk sizes are critical'
    },
    recursive: {
      explanation: 'Intelligently splits text by trying separators in order (paragraphs → sentences → words). Respects document structure while staying near target size.',
      pros: [
        'Respects natural text boundaries',
        'Maintains paragraph/sentence integrity',
        'Better context preservation',
        'More readable chunks'
      ],
      cons: [
        'Variable chunk sizes',
        'Slightly slower than fixed-size',
        'May create very small chunks'
      ],
      bestFor: 'Articles, documentation, books, or any well-structured prose'
    },
    sentence: {
      explanation: 'Groups complete sentences together until reaching target size. Never breaks sentences mid-way, ensuring grammatically complete chunks.',
      pros: [
        'Preserves sentence integrity',
        'Grammatically complete chunks',
        'Natural reading boundaries',
        'Good for QA systems'
      ],
      cons: [
        'More variable chunk sizes',
        'Requires sentence detection',
        'May create small chunks with long sentences'
      ],
      bestFor: 'Question-answering, summaries, or when sentence boundaries are critical'
    },
    semantic: {
      explanation: 'Groups sentences by topic similarity using keyword analysis. Chunks contain related content, improving retrieval relevance.',
      pros: [
        'Topic-coherent chunks',
        'Better semantic retrieval',
        'Related content stays together',
        'Improves answer quality'
      ],
      cons: [
        'Most variable chunk sizes',
        'Slower processing',
        'May miss subtle topic shifts',
        'Requires good keyword overlap'
      ],
      bestFor: 'Complex documents with multiple topics, research papers, or technical manuals'
    },
    sliding_window: {
      explanation: 'Moves a fixed-size window across text with configurable stride. Creates maximum overlap between chunks for better context continuity.',
      pros: [
        'Maximum context preservation',
        'No information loss at boundaries',
        'Configurable overlap via stride',
        'Good for dense information'
      ],
      cons: [
        'Creates more chunks (storage overhead)',
        'High redundancy between chunks',
        'May retrieve duplicate content'
      ],
      bestFor: 'Dense technical content, code, or when context continuity is critical'
    }
  };

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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {strategies.map((strat) => (
              <button
                key={strat.id}
                onClick={() => setStrategy(strat.id as any)}
                disabled={isChunking}
                className={`
                  p-2.5 rounded-lg border-2 transition-all text-left
                  ${
                    strategy === strat.id
                      ? 'border-primary-500 bg-primary-900/20 text-primary-300'
                      : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                  }
                  ${isChunking ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="font-medium text-sm mb-0.5">{strat.name}</div>
                <div className="text-xs text-gray-400">{strat.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Strategy Information Panel */}
        {strategy && strategyInfo[strategy] && (
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-primary-400 mb-2">
              About {strategies.find(s => s.id === strategy)?.name}
            </h3>

            <p className="text-xs text-gray-300 mb-3 leading-relaxed">
              {strategyInfo[strategy].explanation}
            </p>

            <div className="grid grid-cols-2 gap-3 mb-3">
              {/* Pros */}
              <div>
                <div className="text-xs font-medium text-green-400 mb-1.5">✓ Pros</div>
                <ul className="space-y-1">
                  {strategyInfo[strategy].pros.map((pro, idx) => (
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
                  {strategyInfo[strategy].cons.map((con, idx) => (
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
                <span className="text-gray-300">{strategyInfo[strategy].bestFor}</span>
              </div>
            </div>
          </div>
        )}

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
            <strong>💡 Tip:</strong> Experiment with different strategies to find what works best for your use case.
            Chunk size and overlap significantly affect retrieval quality.
          </p>
        </div>
      </div>
    </div>
  );
};
