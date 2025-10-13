/**
 * TypeScript type definitions for the RAG Pipeline Tester
 */

// API Response wrapper
export interface APIResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

// Document types
export interface DocumentMetadata {
  id: string;
  filename: string;
  file_size: number;
  file_type: string;
  upload_timestamp: string;
  status: 'processing' | 'ready' | 'error';
  char_count?: number;
  word_count?: number;
  estimated_tokens?: number;
  error_message?: string;
}

export interface Document {
  id: string;
  filename: string;
  file_size: number;
  file_type: string;
  upload_timestamp: string;
  status: 'processing' | 'ready' | 'error';
  text?: string;
  char_count?: number;
  word_count?: number;
  estimated_tokens?: number;
  error_message?: string;
}

// Phase 2: Chunk types
export interface Chunk {
  chunk_id: string;
  document_id: string;
  chunk_index: number;
  text: string;
  char_count: number;
  estimated_tokens: number;
  start_char: number;
  end_char: number;
}

export interface ChunkStatistics {
  total_chunks: number;
  total_chars: number;
  total_tokens: number;
  avg_chunk_size: number;
  min_chunk_size: number;
  max_chunk_size: number;
  chunk_size_distribution?: {
    small: number;
    medium: number;
    large: number;
  };
}

export interface ChunkRequest {
  document_id: string;
  strategy: 'fixed' | 'recursive';
  chunk_size: number;
  overlap: number;
  separators?: string[];
}

export interface ChunkResponse {
  document_id: string;
  strategy: string;
  chunk_size: number;
  overlap: number;
  total_chunks: number;
  statistics: ChunkStatistics;
  preview: Chunk[];
}

// Phase 3: Embedding types
export interface EmbeddingRequest {
  document_id: string;
  model_type: 'tfidf' | 'sentence_transformer';
  model_name?: string;
  max_features?: number;  // For TF-IDF
  batch_size?: number;    // For sentence transformers
}

export interface EmbeddingMetadata {
  embedding_id: string;
  chunk_id: string;
  document_id: string;
  model_type: string;
  model_name: string;
  dimension: number;
  metadata: {
    // TF-IDF specific
    max_features?: number;
    vocab_size?: number;
    non_zero_features?: number;
    sparsity?: number;
    // Sentence transformer specific
    l2_norm?: number;
    mean?: number;
    std?: number;
    min?: number;
    max?: number;
  };
}

export interface EmbeddingStatistics {
  total_embeddings: number;
  model_type: string;
  model_name: string;
  dimension: number;
  total_size_mb: number;
  avg_size_kb: number;
  // Model-specific stats
  avg_non_zero_features?: number;
  avg_sparsity?: number;
  avg_l2_norm?: number;
}

export interface EmbeddingResponse {
  document_id: string;
  model_type: string;
  model_name: string;
  total_embeddings: number;
  statistics: EmbeddingStatistics;
  preview: EmbeddingMetadata[];
}

export interface EmbeddingsData {
  model_type: string;
  model_name: string;
  total_embeddings: number;
  embeddings_metadata: EmbeddingMetadata[];
}

// Phase 4: Query types
export interface QueryRequest {
  query: string;
  top_k: number;
  threshold?: number;
}

export interface QueryResult {
  rank: number;
  score: number;
  chunk: Chunk;
  document_name: string;
}

// Upload response
export interface UploadResponse {
  document_id: string;
  filename: string;
  file_size: number;
  status: string;
  stats: {
    char_count: number;
    word_count: number;
    estimated_tokens: number;
  };
  text_preview?: string;
}
