/**
 * VectorStoreSelector Component
 * Select between ChromaDB and FAISS backends with storage action
 */

import { useState } from 'react';
import { Database, Zap, Loader2, CheckCircle } from 'lucide-react';
import { storeVectors, type StoreVectorsRequest, type StoreVectorsResponse } from '../utils/api';

interface VectorStoreSelectorProps {
  documentId: string | null;
  hasEmbeddings: boolean;
  onStoreComplete?: (backend: 'chromadb' | 'faiss', response: StoreVectorsResponse) => void;
}

export const VectorStoreSelector: React.FC<VectorStoreSelectorProps> = ({
  documentId,
  hasEmbeddings,
  onStoreComplete,
}) => {
  const [selectedBackend, setSelectedBackend] = useState<'chromadb' | 'faiss'>('chromadb');
  const [collectionName, setCollectionName] = useState('default');
  const [isStoring, setIsStoring] = useState(false);
  const [storeStatus, setStoreStatus] = useState<Record<string, 'success' | 'error' | null>>({
    chromadb: null,
    faiss: null,
  });
  const [error, setError] = useState<string | null>(null);

  const backends = [
    {
      id: 'chromadb' as const,
      name: 'ChromaDB',
      icon: Database,
      description: 'Persistent storage',
      features: ['Easy to use', 'Persistent', 'Full-featured'],
    },
    {
      id: 'faiss' as const,
      name: 'FAISS',
      icon: Zap,
      description: 'Fast similarity search',
      features: ['Lightning fast', 'Memory efficient', 'Scalable'],
    },
  ];

  const handleStore = async () => {
    if (!documentId || !hasEmbeddings) {
      setError('Document must have embeddings before storing');
      return;
    }

    setIsStoring(true);
    setError(null);

    try {
      const request: StoreVectorsRequest = {
        document_id: documentId,
        backend: selectedBackend,
        collection_name: collectionName,
      };

      const response = await storeVectors(request);

      setStoreStatus({
        ...storeStatus,
        [selectedBackend]: 'success',
      });

      onStoreComplete?.(selectedBackend, response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to store vectors');
      setStoreStatus({
        ...storeStatus,
        [selectedBackend]: 'error',
      });
      console.error('Error storing vectors:', err);
    } finally {
      setIsStoring(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-primary-400 mb-4">
          Store Vectors
        </h3>

        {!hasEmbeddings && (
          <div className="mb-4 bg-yellow-900/20 border border-yellow-700 rounded-lg p-3">
            <p className="text-yellow-400 text-sm">
              Generate embeddings before storing vectors
            </p>
          </div>
        )}

        {/* Backend Selection */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-300">
            Vector Database Backend
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {backends.map((backend) => {
              const Icon = backend.icon;
              const status = storeStatus[backend.id];

              return (
                <button
                  key={backend.id}
                  onClick={() => setSelectedBackend(backend.id)}
                  disabled={isStoring}
                  className={`
                    relative p-4 rounded-lg border-2 transition-all text-left
                    ${
                      selectedBackend === backend.id
                        ? 'border-primary-500 bg-primary-900/20'
                        : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                    }
                    ${isStoring ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5 text-primary-400" />
                      <span className="font-semibold text-gray-100">{backend.name}</span>
                    </div>
                    {status === 'success' && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{backend.description}</p>
                  <ul className="space-y-1">
                    {backend.features.map((feature) => (
                      <li key={feature} className="text-xs text-gray-500 flex items-center gap-1">
                        <span className="w-1 h-1 bg-primary-500 rounded-full"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
        </div>

        {/* Collection Name */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Collection Name
          </label>
          <input
            type="text"
            value={collectionName}
            onChange={(e) => setCollectionName(e.target.value)}
            disabled={isStoring}
            placeholder="default"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
                     text-gray-100 placeholder-gray-500
                     focus:outline-none focus:ring-2 focus:ring-primary-500
                     disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">
            Organize vectors into named collections
          </p>
        </div>

        {/* Store Button */}
        <button
          onClick={handleStore}
          disabled={!documentId || !hasEmbeddings || isStoring}
          className="w-full mt-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600
                   text-white rounded-lg font-medium transition-colors
                   flex items-center justify-center gap-2"
        >
          {isStoring ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Storing in {selectedBackend}...
            </>
          ) : (
            <>
              <Database className="w-5 h-5" />
              Store Vectors in {backends.find((b) => b.id === selectedBackend)?.name}
            </>
          )}
        </button>

        {/* Error Message */}
        {error && (
          <div className="mt-4 bg-red-900/20 border border-red-700 rounded-lg p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};
