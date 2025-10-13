/**
 * API client for communicating with the FastAPI backend
 */

import axios from 'axios';
import type { APIResponse, Document, UploadResponse, ChunkRequest, ChunkResponse, Chunk, EmbeddingRequest, EmbeddingResponse, EmbeddingsData, EmbeddingStatistics } from '../types';

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

// Phase 3: Embedding endpoints

/**
 * Generate embeddings for a document's chunks
 */
export const generateEmbeddings = async (request: EmbeddingRequest): Promise<EmbeddingResponse> => {
  const response = await api.post<APIResponse<EmbeddingResponse>>('/api/embed', request);

  if (!response.data.success) {
    throw new Error(response.data.message || 'Embedding generation failed');
  }

  return response.data.data!;
};

/**
 * Get embeddings for a document
 */
export const getDocumentEmbeddings = async (docId: string, includeVectors: boolean = false): Promise<{ embeddings: EmbeddingsData; statistics: EmbeddingStatistics }> => {
  const response = await api.get<APIResponse<{ embeddings: EmbeddingsData; statistics: EmbeddingStatistics }>>(
    `/api/documents/${docId}/embeddings?include_vectors=${includeVectors}`
  );

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to fetch embeddings');
  }

  return {
    embeddings: response.data.data!.embeddings,
    statistics: response.data.data!.statistics
  };
};

// Phase 4: Vector Storage and Search endpoints

export interface StoreVectorsRequest {
  document_id: string;
  backend: 'chromadb' | 'faiss';
  collection_name?: string;
}

export interface StoreVectorsResponse {
  document_id: string;
  backend: string;
  collection: string;
  stored_count: number;
  result: any;
}

export interface SearchRequest {
  query_text: string;
  backend: 'chromadb' | 'faiss';
  collection_name?: string;
  top_k?: number;
  model_type?: string;
  model_name?: string;
}

export interface SearchResult {
  id: string;
  text: string;
  score: number;
  metadata: Record<string, any>;
}

export interface SearchResponse {
  query: string;
  backend: string;
  collection: string;
  top_k: number;
  results_count: number;
  results: SearchResult[];
}

/**
 * Store embeddings in vector database
 */
export const storeVectors = async (request: StoreVectorsRequest): Promise<StoreVectorsResponse> => {
  const response = await api.post<APIResponse<StoreVectorsResponse>>('/api/store', request);

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to store vectors');
  }

  return response.data.data!;
};

/**
 * Search for similar chunks using semantic search
 */
export const searchVectors = async (request: SearchRequest): Promise<SearchResponse> => {
  const response = await api.post<APIResponse<SearchResponse>>('/api/search', request);

  if (!response.data.success) {
    throw new Error(response.data.message || 'Search failed');
  }

  return response.data.data!;
};

/**
 * List all collections in a vector database
 */
export const listCollections = async (backend: 'chromadb' | 'faiss' = 'chromadb'): Promise<string[]> => {
  const response = await api.get<APIResponse<{ collections: string[] }>>(`/api/collections?backend=${backend}`);

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to list collections');
  }

  return response.data.data!.collections;
};

/**
 * Delete a collection from vector database
 */
export const deleteCollection = async (collectionName: string, backend: 'chromadb' | 'faiss' = 'chromadb'): Promise<void> => {
  const response = await api.delete<APIResponse>(`/api/collections/${collectionName}?backend=${backend}`);

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to delete collection');
  }
};

/**
 * Get statistics for a collection
 */
export const getCollectionStats = async (collectionName: string, backend: 'chromadb' | 'faiss' = 'chromadb'): Promise<any> => {
  const response = await api.get<APIResponse<{ stats: any }>>(`/api/collections/${collectionName}/stats?backend=${backend}`);

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to get collection stats');
  }

  return response.data.data!.stats;
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
