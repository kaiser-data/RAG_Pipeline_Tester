/**
 * TextDisplay Component
 * Displays extracted text from selected document
 * Phase 2: Compact collapsible view
 */

import { useState } from 'react';
import { FileText, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import type { Document } from '../types';

interface TextDisplayProps {
  document: Document | null;
}

export const TextDisplay: React.FC<TextDisplayProps> = ({ document }) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!document) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h2 className="text-lg font-semibold mb-2 text-primary-400">Document Info</h2>
        <div className="text-center py-8 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Select a document</p>
        </div>
      </div>
    );
  }

  const handleCopy = async () => {
    if (document.text) {
      await navigator.clipboard.writeText(document.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-750 transition-colors"
      >
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-primary-500" />
          <div className="text-left">
            <h2 className="text-lg font-semibold text-primary-400">Document Info</h2>
            <p className="text-xs text-gray-400">{document.filename}</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-700">
          {/* Stats */}
          {document.status === 'ready' && (
            <div className="grid grid-cols-3 gap-3 my-4 p-3 bg-gray-900 rounded-lg">
              <div>
                <div className="text-xs text-gray-400 mb-1">Characters</div>
                <div className="text-base font-semibold text-gray-100">
                  {document.char_count?.toLocaleString() || 0}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Words</div>
                <div className="text-base font-semibold text-gray-100">
                  {document.word_count?.toLocaleString() || 0}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Est. Tokens</div>
                <div className="text-base font-semibold text-gray-100">
                  {document.estimated_tokens?.toLocaleString() || 0}
                </div>
              </div>
            </div>
          )}

          {/* Copy Button */}
          {document.text && (
            <button
              onClick={handleCopy}
              className="w-full mb-3 flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600
                       text-gray-300 rounded text-sm transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Text
                </>
              )}
            </button>
          )}

          {/* Text Preview */}
          {document.status === 'ready' && document.text ? (
            <div className="bg-gray-900 rounded-lg p-3 border border-gray-700 max-h-64 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-xs text-gray-300 font-mono leading-relaxed">
                {document.text}
              </pre>
            </div>
          ) : document.status === 'processing' ? (
            <div className="text-center py-8 text-gray-400">
              <div className="animate-spin w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-sm">Processing...</p>
            </div>
          ) : document.status === 'error' ? (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
              <p className="text-red-400 text-sm">
                Error: {document.error_message || 'Failed to process'}
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
