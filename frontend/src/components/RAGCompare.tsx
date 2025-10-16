/**
 * RAGCompare Component
 * Phase 6: Multi-provider comparison interface
 */

import { useState, useEffect } from 'react';
import { GitCompare, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { getAvailableProviders, ragCompare, type RAGCompareRequest, type RAGCompareResponse } from '../utils/api';

export const RAGCompare: React.FC = () => {
  const [providers, setProviders] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<RAGCompareResponse | null>(null);

  // Form state
  const [question, setQuestion] = useState('');
  const [backend, setBackend] = useState<'chromadb' | 'faiss'>('chromadb');
  const [collectionName, setCollectionName] = useState('default');
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [topK, setTopK] = useState(3);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(500);

  // Load available providers
  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setLoadingProviders(true);
      const availableProviders = await getAvailableProviders();
      setProviders(availableProviders);
      // Select all providers by default
      setSelectedProviders(availableProviders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load providers');
      console.error('Error loading providers:', err);
    } finally {
      setLoadingProviders(false);
    }
  };

  const toggleProvider = (provider: string) => {
    if (selectedProviders.includes(provider)) {
      setSelectedProviders(selectedProviders.filter((p) => p !== provider));
    } else {
      setSelectedProviders([...selectedProviders, provider]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }

    if (selectedProviders.length === 0) {
      setError('Please select at least one provider');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResponse(null);

      const request: RAGCompareRequest = {
        question: question.trim(),
        collection_name: collectionName,
        backend,
        providers: selectedProviders,
        top_k: topK,
        temperature,
        max_tokens: maxTokens,
      };

      const result = await ragCompare(request);
      setResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Comparison failed');
      console.error('RAG compare error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Comparison Form */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <GitCompare className="w-6 h-6 text-primary-500" />
          <h3 className="text-lg font-semibold text-gray-100">Compare Providers</h3>
        </div>

        {loadingProviders ? (
          <div className="flex items-center gap-2 text-gray-400 py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading providers...</span>
          </div>
        ) : providers.length < 2 ? (
          <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
            <p className="text-yellow-400 text-sm">
              Need at least 2 providers for comparison. Currently available: {providers.length}
            </p>
            <p className="text-yellow-500 text-xs mt-2">
              Configure multiple API keys or start Ollama for comparison.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Question Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Question
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question to compare providers..."
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
                         text-gray-100 placeholder-gray-400
                         focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                disabled={loading}
              />
            </div>

            {/* Provider Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Providers to Compare
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {providers.map((provider) => (
                  <label
                    key={provider}
                    className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer
                              transition-colors ${
                                selectedProviders.includes(provider)
                                  ? 'bg-primary-600 border-primary-500 text-white'
                                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
                              }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedProviders.includes(provider)}
                      onChange={() => toggleProvider(provider)}
                      disabled={loading}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">
                      {provider.charAt(0).toUpperCase() + provider.slice(1)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Backend and Parameters */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Backend</label>
                <select
                  value={backend}
                  onChange={(e) => setBackend(e.target.value as 'chromadb' | 'faiss')}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
                           text-gray-100 focus:outline-none focus:border-primary-500"
                  disabled={loading}
                >
                  <option value="chromadb">ChromaDB</option>
                  <option value="faiss">FAISS</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Collection</label>
                <input
                  type="text"
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  placeholder="default"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
                           text-gray-100 placeholder-gray-500 focus:outline-none focus:border-primary-500"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Top K</label>
                <input
                  type="number"
                  value={topK}
                  onChange={(e) => setTopK(parseInt(e.target.value))}
                  min={1}
                  max={20}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
                           text-gray-100 focus:outline-none focus:border-primary-500"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Temperature
                </label>
                <input
                  type="number"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  min={0}
                  max={1}
                  step={0.1}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
                           text-gray-100 focus:outline-none focus:border-primary-500"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Tokens
                </label>
                <input
                  type="number"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  min={50}
                  max={4000}
                  step={50}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
                           text-gray-100 focus:outline-none focus:border-primary-500"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !question.trim() || selectedProviders.length === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-3
                       bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700
                       disabled:text-gray-500 disabled:cursor-not-allowed
                       text-white font-medium rounded-lg transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Comparing providers...
                </>
              ) : (
                <>
                  <GitCompare className="w-5 h-5" />
                  Compare Answers
                </>
              )}
            </button>
          </form>
        )}

        {error && (
          <div className="mt-4 bg-red-900/20 border border-red-700 rounded-lg p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Comparison Results */}
      {response && (
        <div className="space-y-4">
          {/* Shared Context */}
          <details className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <summary className="cursor-pointer text-sm font-medium text-gray-300 hover:text-gray-100">
              Shared Context ({response.context.length} chunks)
            </summary>
            <div className="mt-3 space-y-2">
              {response.context.map((chunk, idx) => (
                <div key={idx} className="bg-gray-900 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">Chunk {idx + 1}</span>
                    <span className="text-xs text-gray-400">Score: {chunk.score.toFixed(4)}</span>
                  </div>
                  <p className="text-sm text-gray-300">{chunk.text}</p>
                </div>
              ))}
            </div>
          </details>

          {/* Provider Answers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Object.entries(response.providers).map(([providerName, result]) => (
              <div
                key={providerName}
                className="bg-gray-800 rounded-lg border border-gray-700 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  {result.error ? (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-green-500" />
                  )}
                  <h4 className="text-lg font-semibold text-gray-100 capitalize">
                    {providerName}
                  </h4>
                  {result.model && (
                    <span className="ml-auto text-xs text-gray-400">{result.model}</span>
                  )}
                </div>

                {result.error ? (
                  <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
                    <p className="text-red-400 text-sm">{result.error}</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-gray-900 rounded-lg p-4 mb-4">
                      <p className="text-gray-100 whitespace-pre-wrap leading-relaxed">
                        {result.answer}
                      </p>
                    </div>

                    {result.usage && (
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400">Prompt:</span>
                          <span className="ml-1 text-gray-100 font-medium">
                            {result.usage.prompt_tokens}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Completion:</span>
                          <span className="ml-1 text-gray-100 font-medium">
                            {result.usage.completion_tokens}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Total:</span>
                          <span className="ml-1 text-gray-100 font-medium">
                            {result.usage.total_tokens}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
