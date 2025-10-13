/**
 * API client for communicating with the FastAPI backend
 */

import axios from 'axios';
import type { APIResponse, Document, UploadResponse, ChunkRequest, ChunkResponse, Chunk } from '../types';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// API endpoints

/**
 * Upload a document file
 */
export const uploadDocument = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<APIResponse<UploadResponse>>('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  if (!response.data.success) {
    throw new Error(response.data.message || 'Upload failed');
  }

  return response.data.data!;
};

/**
 * Get all documents
 */
export const getDocuments = async (): Promise<Document[]> => {
  const response = await api.get<APIResponse<{ documents: Document[] }>>('/api/documents');

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to fetch documents');
  }

  return response.data.data!.documents;
};

/**
 * Get a specific document by ID
 */
export const getDocument = async (docId: string): Promise<Document> => {
  const response = await api.get<APIResponse<{ document: Document }>>(`/api/documents/${docId}`);

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to fetch document');
  }

  return response.data.data!.document;
};

/**
 * Delete a document
 */
export const deleteDocument = async (docId: string): Promise<void> => {
  const response = await api.delete<APIResponse>(`/api/documents/${docId}`);

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to delete document');
  }
};

/**
 * Health check
 */
export const healthCheck = async (): Promise<any> => {
  const response = await api.get('/api/health');
  return response.data;
};

// Phase 2: Chunking endpoints

/**
 * Chunk a document
 */
export const chunkDocument = async (request: ChunkRequest): Promise<ChunkResponse> => {
  const response = await api.post<APIResponse<ChunkResponse>>('/api/chunk', request);

  if (!response.data.success) {
    throw new Error(response.data.message || 'Chunking failed');
  }

  return response.data.data!;
};

/**
 * Get all chunks for a document
 */
export const getDocumentChunks = async (docId: string): Promise<{ chunks: Chunk[]; statistics: any }> => {
  const response = await api.get<APIResponse<{ chunks: Chunk[]; statistics: any }>>(`/api/documents/${docId}/chunks`);

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to fetch chunks');
  }

  return {
    chunks: response.data.data!.chunks,
    statistics: response.data.data!.statistics
  };
};

// Error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error
      console.error('API Error:', error.response.data);
      throw new Error(error.response.data.detail || 'An error occurred');
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error:', error.request);
      throw new Error('Network error - please check if the backend is running');
    } else {
      // Something else happened
      console.error('Error:', error.message);
      throw error;
    }
  }
);

export default api;
