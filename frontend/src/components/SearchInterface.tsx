/**
 * SearchInterface Component
 * Semantic search interface with backend selection
 */

import { useState } from 'react';
import { Search, Loader2, Database, Zap } from 'lucide-react';
import { searchVectors, type SearchRequest, type SearchResponse } from '../utils/api';

interface SearchInterfaceProps {
  onSearchComplete?: (results: SearchResponse) => void;
}

export const SearchInterface: React.FC<SearchInterfaceProps> = ({
  onSearchComplete,
}) => {
  const [queryText, setQueryText] = useState('');
  const [selectedBackend, setSelectedBackend] = useState<'chromadb' | 'faiss'>('chromadb');
  const [collectionName, setCollectionName] = useState('default');
  const [topK, setTopK] = useState(5);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const backends = [
    { id: 'chromadb' as const, name: 'ChromaDB', icon: Database },
    { id: 'faiss' as const, name: 'FAISS', icon: Zap },
  ];

  const handleSearch = async () => {
    if (!queryText.trim()) {
      setError('Please enter a search query');
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const request: SearchRequest = {
        query_text: queryText,
        backend: selectedBackend,
        collection_name: collectionName,
        top_k: topK,
        model_type: 'sentence_transformer',
        model_name: 'all-MiniLM-L6-v2',
      };

      const response = await searchVectors(request);
      onSearchComplete?.(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      console.error('Error searching:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-4">
        <Search className="w-6 h-6 text-primary-500" />
        <h2 className="text-xl font-semibold text-primary-400">
          Semantic Search
        </h2>
      </div>

      <div className="space-y-4">
        {/* Search Query */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Search Query
          </label>
          <textarea
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isSearching}
            placeholder="Enter your search query... (e.g., 'What is machine learning?')"
            rows={3}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
                     text-gray-100 placeholder-gray-500 resize-none
                     focus:outline-none focus:ring-2 focus:ring-primary-500
                     disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">
            Press Enter to search, Shift+Enter for new line
          </p>
        </div>

        {/* Backend Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Vector Database Backend
          </label>
          <div className="grid grid-cols-2 gap-2">
            {backends.map((backend) => {
              const Icon = backend.icon;
              return (
                <button
                  key={backend.id}
                  onClick={() => setSelectedBackend(backend.id)}
                  disabled={isSearching}
                  className={`
                    flex items-center justify-center gap-2 p-2.5 rounded-lg border-2 transition-all
                    ${
                      selectedBackend === backend.id
                        ? 'border-primary-500 bg-primary-900/20 text-primary-300'
                        : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                    }
                    ${isSearching ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{backend.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Collection Name & Top-K in same row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Collection Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Collection
            </label>
            <input
              type="text"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              disabled={isSearching}
              placeholder="default"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
                       text-gray-100 placeholder-gray-500
                       focus:outline-none focus:ring-2 focus:ring-primary-500
                       disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Top-K Results */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">
                Top Results
              </label>
              <span className="text-sm text-primary-400 font-mono">
                {topK}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              disabled={isSearching}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1</span>
              <span>10</span>
              <span>20</span>
            </div>
          </div>
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          disabled={!queryText.trim() || isSearching}
          className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600
                   text-white rounded-lg font-medium transition-colors
                   flex items-center justify-center gap-2"
        >
          {isSearching ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Search
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
  );
};
