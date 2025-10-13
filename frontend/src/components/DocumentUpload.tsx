/**
 * DocumentUpload Component
 * Phase 1: Simple file upload with button (no drag-drop yet)
 */

import { useState, useRef } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { uploadDocument } from '../utils/api';

interface DocumentUploadProps {
  onUploadSuccess: () => void;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ onUploadSuccess }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['.txt', '.md'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!allowedTypes.includes(fileExt)) {
      setError(`Unsupported file type. Allowed types: ${allowedTypes.join(', ')}`);
      return;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File too large. Maximum size: 10MB');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      await uploadDocument(file);
      onUploadSuccess();

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-xl font-semibold mb-4 text-primary-400">Upload Document</h2>

      <div className="space-y-4">
        <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />

          <div className="flex flex-col items-center gap-4">
            {isUploading ? (
              <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
            ) : (
              <Upload className="w-12 h-12 text-gray-400" />
            )}

            <div>
              <button
                onClick={handleButtonClick}
                disabled={isUploading}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600
                         text-white rounded-lg font-medium transition-colors"
              >
                {isUploading ? 'Uploading...' : 'Select File'}
              </button>
            </div>

            <p className="text-sm text-gray-400">
              Supported formats: .txt, .md (Phase 1)
            </p>
            <p className="text-xs text-gray-500">
              Maximum file size: 10MB
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {isUploading && (
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
            <p className="text-blue-400 text-sm">Uploading and processing document...</p>
          </div>
        )}
      </div>
    </div>
  );
};
