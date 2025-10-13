/**
 * SearchResults Component
 * Display semantic search results with similarity scores
 */

import { FileText, Star, Hash } from 'lucide-react';
import type { SearchResponse } from '../utils/api';

interface SearchResultsProps {
  results: SearchResponse | null;
}

export const SearchResults: React.FC<SearchResultsProps> = ({ results }) => {
  if (!results) {
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="text-center py-12 text-gray-400">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No search results yet</p>
          <p className="text-sm mt-2">Enter a query to search for similar chunks</p>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-400';
    if (score >= 0.6) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-900/20 border-green-700';
    if (score >= 0.6) return 'bg-yellow-900/20 border-yellow-700';
    return 'bg-orange-900/20 border-orange-700';
  };

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-primary-400">
              Search Results
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Query: <span className="text-gray-300 italic">"{results.query}"</span>
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">
              Found <span className="text-primary-400 font-semibold">{results.results_count}</span> results
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Backend: {results.backend} | Collection: {results.collection}
            </div>
          </div>
        </div>
      </div>

      {/* Results List */}
      {results.results.length === 0 ? (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="text-center py-12 text-gray-400">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No matching results found</p>
            <p className="text-sm mt-2">Try a different query or check your collection</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {results.results.map((result, index) => (
            <div
              key={result.id}
              className="bg-gray-800 rounded-lg border border-gray-700 p-4 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                {/* Rank Badge */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary-900/30 border border-primary-700 rounded-lg">
                    <span className="text-sm font-bold text-primary-400">#{index + 1}</span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Chunk ID</div>
                    <div className="text-xs text-gray-400 font-mono">{result.metadata.chunk_index}</div>
                  </div>
                </div>

                {/* Similarity Score */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getScoreBgColor(result.score)}`}>
                  <Star className={`w-4 h-4 ${getScoreColor(result.score)}`} />
                  <div>
                    <div className="text-xs text-gray-400">Similarity</div>
                    <div className={`text-sm font-bold ${getScoreColor(result.score)}`}>
                      {(result.score * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Result Text */}
              <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {result.text}
                </p>
              </div>

              {/* Metadata */}
              <div className="mt-3 flex flex-wrap gap-3 text-xs">
                <div className="flex items-center gap-1 text-gray-500">
                  <Hash className="w-3 h-3" />
                  <span>Doc: {result.metadata.document_id?.substring(0, 8)}...</span>
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <span>Model: {result.metadata.model_name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
