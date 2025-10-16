# Backend Dockerfile for RAG Compare Application
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies with increased timeout
RUN pip install --no-cache-dir --default-timeout=300 -r requirements.txt

# Download NLTK data (required for sentence tokenization)
RUN python -c "import nltk; nltk.download('punkt'); nltk.download('punkt_tab')"

# Copy application code
COPY app/ ./app/
COPY .env.example ./.env.example

# Create directories for persistent storage
RUN mkdir -p /app/uploads /app/chroma_db /app/faiss_db

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV HOST=0.0.0.0
ENV PORT=8000

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
