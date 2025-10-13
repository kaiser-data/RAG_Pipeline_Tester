/**
 * DatabaseManager Component
 * Manage vector database collections - view, refresh, and delete
 */

import { useState, useEffect } from 'react';
import { Database, RefreshCw, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { listCollections, deleteCollection, getCollectionStats } from '../utils/api';

interface CollectionInfo {
  name: string;
  backend: 'chromadb' | 'faiss';
  count?: number;
  loading?: boolean;
}

export const DatabaseManager: React.FC = () => {
  const [collections, setCollections] = useState<CollectionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load collections from both backends
      const [chromaCollections, faissCollections] = await Promise.all([
        listCollections('chromadb'),
        listCollections('faiss')
      ]);

      const allCollections: CollectionInfo[] = [
        ...chromaCollections.map(name => ({ name, backend: 'chromadb' as const })),
        ...faissCollections.map(name => ({ name, backend: 'faiss' as const }))
      ];

      // Load stats for each collection
      const collectionsWithStats = await Promise.all(
        allCollections.map(async (col) => {
          try {
            const stats = await getCollectionStats(col.name, col.backend);
            return { ...col, count: stats.count || 0 };
          } catch (err) {
            return { ...col, count: 0 };
          }
        })
      );

      setCollections(collectionsWithStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load collections');
      console.error('Error loading collections:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setSuccessMessage(null);
    await loadCollections();
    setSuccessMessage('Collections refreshed');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleDelete = async (collectionName: string, backend: 'chromadb' | 'faiss') => {
    if (!confirm(`Are you sure you want to delete collection "${collectionName}" from ${backend}? This action cannot be undone.`)) {
      return;
    }

    try {
      setError(null);
      setSuccessMessage(null);

      // Mark as loading
      setCollections(collections.map(col =>
        col.name === collectionName && col.backend === backend
          ? { ...col, loading: true }
          : col
      ));

      await deleteCollection(collectionName, backend);

      // Remove from list
      setCollections(collections.filter(col =>
        !(col.name === collectionName && col.backend === backend)
      ));

      setSuccessMessage(`Deleted collection "${collectionName}" from ${backend}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete collection');
      console.error('Error deleting collection:', err);

      // Remove loading state
      setCollections(collections.map(col =>
        col.name === collectionName && col.backend === backend
          ? { ...col, loading: false }
          : col
      ));
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Database className="w-6 h-6 text-primary-500" />
          <h3 className="text-lg font-semibold text-gray-100">Database Management</h3>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600
                   disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed
                   text-gray-200 rounded-lg transition-colors text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-900/20 border border-red-700 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 bg-green-900/20 border border-green-700 rounded-lg p-3 flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-green-400 text-sm">{successMessage}</p>
        </div>
      )}

      {loading && collections.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">
          Loading collections...
        </div>
      ) : collections.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">
          No collections found. Upload and store documents to create collections.
        </div>
      ) : (
        <div className="space-y-2">
          {collections.map((col) => (
            <div
              key={`${col.backend}-${col.name}`}
              className="flex items-center justify-between p-3 bg-gray-900 rounded-lg border border-gray-700"
            >
              <div className="flex items-center gap-3 flex-1">
                <Database className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <div className="font-medium text-gray-200 text-sm">{col.name}</div>
                  <div className="text-xs text-gray-400">
                    {col.backend} • {col.count !== undefined ? `${col.count} vectors` : 'loading...'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDelete(col.name, col.backend)}
                disabled={col.loading}
                className="flex items-center gap-2 px-3 py-1.5 text-red-400 hover:bg-red-900/20
                         disabled:opacity-50 disabled:cursor-not-allowed
                         rounded transition-colors text-sm"
                title="Delete collection"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-xs text-gray-500">
          Collections store your document embeddings for fast semantic search and RAG queries.
          Deleting a collection will remove all stored vectors but won't affect your original documents.
        </p>
      </div>
    </div>
  );
};
