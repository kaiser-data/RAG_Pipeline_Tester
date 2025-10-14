/**
 * RAGQuery Component
 * Phase 6: RAG query interface with provider selection and configuration
 */

import { useState, useEffect } from 'react';
import { Send, Loader2, Sparkles, Settings2, MessageSquare } from 'lucide-react';
import { getAvailableProviders, ragQuery, type RAGQueryRequest, type RAGQueryResponse } from '../utils/api';

interface RAGQueryProps {
  onQueryComplete?: (response: RAGQueryResponse) => void;
  defaultCollection?: string;
  defaultBackend?: 'chromadb' | 'faiss';
}

export const RAGQuery: React.FC<RAGQueryProps> = ({
  onQueryComplete,
  defaultCollection = 'default',
  defaultBackend = 'chromadb'
}) => {
  const [providers, setProviders] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<RAGQueryResponse | null>(null);

  // Form state
  const [question, setQuestion] = useState('');
  const [provider, setProvider] = useState('');
  const [backend, setBackend] = useState<'chromadb' | 'faiss'>(defaultBackend);
  const [collectionName, setCollectionName] = useState(defaultCollection);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Advanced parameters
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
      if (availableProviders.length > 0) {
        setProvider(availableProviders[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load providers');
      console.error('Error loading providers:', err);
    } finally {
      setLoadingProviders(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }

    if (!provider) {
      setError('Please select a provider');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResponse(null);

      const request: RAGQueryRequest = {
        question: question.trim(),
        provider,
        collection_name: collectionName,
        backend,
        top_k: topK,
        temperature,
        max_tokens: maxTokens,
      };

      const result = await ragQuery(request);
      setResponse(result);

      if (onQueryComplete) {
        onQueryComplete(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query failed');
      console.error('RAG query error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Query Form */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="w-6 h-6 text-primary-500" />
          <h3 className="text-lg font-semibold text-gray-100">RAG Query</h3>
        </div>

        {loadingProviders ? (
          <div className="flex items-center gap-2 text-gray-400 py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading providers...</span>
          </div>
        ) : providers.length === 0 ? (
          <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
            <p className="text-yellow-400 text-sm">
              No LLM providers available. Please configure API keys or start Ollama.
            </p>
            <p className="text-yellow-500 text-xs mt-2">
              Set OPENAI_API_KEY, ANTHROPIC_API_KEY environment variables or start Ollama server.
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
                placeholder="Ask a question about your documents..."
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
                         text-gray-100 placeholder-gray-400
                         focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                disabled={loading}
              />
            </div>

            {/* Provider Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  LLM Provider
                </label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
                           text-gray-100 focus:outline-none focus:border-primary-500"
                  disabled={loading}
                >
                  {providers.map((p) => (
                    <option key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Vector Backend
                </label>
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
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Collection Name
                </label>
                <input
                  type="text"
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  placeholder="default"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
                           text-gray-100 placeholder-gray-500
                           focus:outline-none focus:border-primary-500"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Advanced Settings Toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
            >
              <Settings2 className="w-4 h-4" />
              {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
            </button>

            {/* Advanced Settings */}
            {showAdvanced && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Top K Results
                  </label>
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
                    Temperature ({temperature})
                  </label>
                  <input
                    type="range"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    min={0}
                    max={1}
                    step={0.1}
                    className="w-full"
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
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !question.trim() || !provider}
              className="w-full flex items-center justify-center gap-2 px-4 py-3
                       bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700
                       disabled:text-gray-500 disabled:cursor-not-allowed
                       text-white font-medium rounded-lg transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating answer...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Ask Question
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

      {/* Response Display */}
      {response && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-6 h-6 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-100">Answer</h3>
            <span className="ml-auto text-xs text-gray-400">
              {response.provider} • {response.model}
            </span>
          </div>

          {/* Answer */}
          <div className="bg-gray-900 rounded-lg p-4 mb-4">
            <p className="text-gray-100 whitespace-pre-wrap leading-relaxed">
              {response.answer}
            </p>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Context Chunks:</span>
              <span className="ml-2 text-gray-100 font-medium">{response.num_chunks}</span>
            </div>
            <div>
              <span className="text-gray-400">Prompt Tokens:</span>
              <span className="ml-2 text-gray-100 font-medium">{response.usage.prompt_tokens}</span>
            </div>
            <div>
              <span className="text-gray-400">Completion Tokens:</span>
              <span className="ml-2 text-gray-100 font-medium">{response.usage.completion_tokens}</span>
            </div>
            <div>
              <span className="text-gray-400">Total Tokens:</span>
              <span className="ml-2 text-gray-100 font-medium">{response.usage.total_tokens}</span>
            </div>
          </div>

          {/* Context Chunks */}
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">
              View Retrieved Context ({response.context.length} chunks)
            </summary>
            <div className="mt-3 space-y-3">
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
        </div>
      )}
    </div>
  );
};
