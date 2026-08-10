-- Enable pgvector extension if PostgreSQL is used
CREATE EXTENSION IF NOT EXISTS vector;

-- Table app_knowledge_chunks for storing RAG document chunks and embeddings
CREATE TABLE IF NOT EXISTS app_knowledge_chunks (
    id BIGSERIAL PRIMARY KEY,
    topic VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    keywords VARCHAR(500),
    content_hash VARCHAR(64) UNIQUE NOT NULL,
    embedding VECTOR(768) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create HNSW index for high performance vector cosine similarity search
CREATE INDEX IF NOT EXISTS idx_app_knowledge_chunks_embedding 
ON app_knowledge_chunks 
USING hnsw (embedding vector_cosine_ops);
