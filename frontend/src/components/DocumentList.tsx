/**
 * DocumentList Component
 * Displays uploaded documents with metadata
 */

import { useState } from 'react';
import { FileText, Trash2, Eye, Clock, FileType, AlertCircle } from 'lucide-react';
import type { Document } from '../types';

interface DocumentListProps {
  documents: Document[];
  onDocumentSelect: (doc: Document) => void;
  onDocumentDelete: (docId: string) => void;
  selectedDocIds?: string[];
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onDocumentSelect,
  onDocumentDelete,
  selectedDocIds = [],
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (docId: string, event: React.MouseEvent) => {
    event.stopPropagation();

    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    setDeletingId(docId);
    try {
      await onDocumentDelete(docId);
    } finally {
      setDeletingId(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusColor = (status: Document['status']) => {
    switch (status) {
      case 'ready':
        return 'text-green-400 bg-green-900/20 border-green-700';
      case 'processing':
        return 'text-yellow-400 bg-yellow-900/20 border-yellow-700';
      case 'error':
        return 'text-red-400 bg-red-900/20 border-red-700';
      default:
        return 'text-gray-400 bg-gray-900/20 border-gray-700';
    }
  };

  if (documents.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-primary-400">Documents</h2>
        <div className="text-center py-12 text-gray-400">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No documents uploaded yet</p>
          <p className="text-sm mt-2">Upload a document to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-xl font-semibold mb-4 text-primary-400">
        Documents ({documents.length})
      </h2>

      <div className="space-y-3">
        {documents.map((doc) => (
          <div
            key={doc.id}
            onClick={() => onDocumentSelect(doc)}
            className={`
              bg-gray-900 rounded-lg p-4 border cursor-pointer transition-all
              ${
                selectedDocIds.includes(doc.id)
                  ? 'border-primary-500 bg-primary-900/10'
                  : 'border-gray-700 hover:border-gray-600'
              }
            `}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <FileText className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate text-gray-100">
                    {doc.filename}
                  </h3>

                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <FileType className="w-3 h-3" />
                      {formatFileSize(doc.file_size)}
                    </span>

                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(doc.upload_timestamp)}
                    </span>

                    {doc.estimated_tokens && (
                      <span>~{doc.estimated_tokens.toLocaleString()} tokens</span>
                    )}
                  </div>

                  <div className="mt-2">
                    <span
                      className={`
                        inline-block px-2 py-1 text-xs rounded border
                        ${getStatusColor(doc.status)}
                      `}
                    >
                      {doc.status}
                    </span>
                  </div>

                  {doc.error_message && (
                    <div className="mt-2 flex items-start gap-2 text-xs text-red-400">
                      <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      <span>{doc.error_message}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {selectedDocIds.includes(doc.id) && (
                  <Eye className="w-4 h-4 text-primary-400" />
                )}

                <button
                  onClick={(e) => handleDelete(doc.id, e)}
                  disabled={deletingId === doc.id}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20
                           rounded transition-colors disabled:opacity-50"
                  title="Delete document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
