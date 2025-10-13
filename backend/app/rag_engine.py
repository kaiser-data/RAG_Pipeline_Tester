"""
RAG Engine
Phase 6: Orchestrates retrieval and generation with multiple LLM providers
"""

from typing import Dict, Any, List, Optional
import logging
from app.llm_providers import LLMProvider, OpenAIProvider, AnthropicProvider, OllamaProvider
from app.vector_store import VectorStoreManager

logger = logging.getLogger(__name__)


class RAGEngine:
    """
    RAG (Retrieval-Augmented Generation) Engine
    Combines vector search with LLM generation
    """

    def __init__(self, vector_store_manager: VectorStoreManager):
        """
        Initialize RAG engine

        Args:
            vector_store_manager: Manager for vector storage and retrieval
        """
        self.vector_store = vector_store_manager
        self.providers: Dict[str, LLMProvider] = {}

    def register_provider(self, name: str, provider: LLMProvider):
        """
        Register an LLM provider

        Args:
            name: Provider identifier (openai, anthropic, ollama)
            provider: LLMProvider instance
        """
        if provider.is_available():
            self.providers[name] = provider
            logger.info(f"Registered LLM provider: {name}")
        else:
            logger.warning(f"Provider {name} not available, skipping registration")

    def get_available_providers(self) -> List[str]:
        """Get list of available provider names"""
        return list(self.providers.keys())

    def query(
        self,
        question: str,
        provider_name: str,
        collection_name: str,
        backend: str = "chromadb",
        top_k: int = 3,
        temperature: float = 0.7,
        max_tokens: int = 1000,
        system_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Execute RAG query: retrieve context + generate answer

        Args:
            question: User question
            provider_name: LLM provider to use (openai, anthropic, ollama)
            collection_name: Vector collection to search
            backend: Vector store backend (chromadb or faiss)
            top_k: Number of context chunks to retrieve
            temperature: LLM temperature
            max_tokens: Maximum tokens to generate
            system_prompt: Optional system prompt override

        Returns:
            Dict with:
                - answer: Generated answer
                - context: Retrieved context chunks
                - model: Model used
                - usage: Token usage
                - provider: Provider name
        """
        # Validate provider
        if provider_name not in self.providers:
            available = ", ".join(self.get_available_providers())
            raise ValueError(
                f"Provider '{provider_name}' not available. "
                f"Available providers: {available}"
            )

        provider = self.providers[provider_name]

        try:
            # Step 1: Retrieve relevant context
            logger.info(f"Retrieving context from {backend}/{collection_name}")
            search_results = self.vector_store.search(
                query_text=question,
                collection_name=collection_name,
                backend=backend,
                top_k=top_k
            )

            context_chunks = [
                {
                    "text": result["text"],
                    "metadata": result["metadata"],
                    "score": result["score"]
                }
                for result in search_results
            ]

            # Step 2: Build RAG prompt
            system, user_prompt = provider.build_rag_prompt(
                question=question,
                context_chunks=context_chunks,
                system_prompt=system_prompt
            )

            # Step 3: Generate answer
            logger.info(f"Generating answer with {provider_name}")
            generation = provider.generate(
                prompt=user_prompt,
                system_prompt=system,
                temperature=temperature,
                max_tokens=max_tokens
            )

            # Step 4: Return combined results
            return {
                "answer": generation["text"],
                "context": context_chunks,
                "model": generation["model"],
                "usage": generation["usage"],
                "provider": generation["provider"],
                "retrieval_backend": backend,
                "num_chunks": len(context_chunks)
            }

        except Exception as e:
            logger.error(f"RAG query failed: {e}")
            raise

    def compare_providers(
        self,
        question: str,
        collection_name: str,
        backend: str = "chromadb",
        providers: Optional[List[str]] = None,
        top_k: int = 3,
        temperature: float = 0.7,
        max_tokens: int = 1000
    ) -> Dict[str, Any]:
        """
        Compare answers from multiple providers using same context

        Args:
            question: User question
            collection_name: Vector collection to search
            backend: Vector store backend
            providers: List of provider names to compare (None = all available)
            top_k: Number of context chunks
            temperature: LLM temperature
            max_tokens: Maximum tokens

        Returns:
            Dict with results from each provider
        """
        if providers is None:
            providers = self.get_available_providers()

        if not providers:
            raise ValueError("No providers available for comparison")

        # Retrieve context once (shared across all providers)
        logger.info(f"Retrieving shared context from {backend}/{collection_name}")
        search_results = self.vector_store.search(
            query_text=question,
            collection_name=collection_name,
            backend=backend,
            top_k=top_k
        )

        context_chunks = [
            {
                "text": result["text"],
                "metadata": result["metadata"],
                "score": result["score"]
            }
            for result in search_results
        ]

        # Generate answers from each provider
        results = {
            "question": question,
            "context": context_chunks,
            "providers": {}
        }

        for provider_name in providers:
            if provider_name not in self.providers:
                logger.warning(f"Skipping unavailable provider: {provider_name}")
                continue

            try:
                provider = self.providers[provider_name]

                # Build prompt
                system, user_prompt = provider.build_rag_prompt(
                    question=question,
                    context_chunks=context_chunks
                )

                # Generate
                generation = provider.generate(
                    prompt=user_prompt,
                    system_prompt=system,
                    temperature=temperature,
                    max_tokens=max_tokens
                )

                results["providers"][provider_name] = {
                    "answer": generation["text"],
                    "model": generation["model"],
                    "usage": generation["usage"]
                }

                logger.info(f"Generated answer with {provider_name}")

            except Exception as e:
                logger.error(f"Failed to generate with {provider_name}: {e}")
                results["providers"][provider_name] = {
                    "error": str(e)
                }

        return results


# Global RAG engine instance
rag_engine: Optional[RAGEngine] = None


def get_rag_engine() -> RAGEngine:
    """Get global RAG engine instance"""
    if rag_engine is None:
        raise RuntimeError("RAG engine not initialized")
    return rag_engine


def initialize_rag_engine(
    vector_store_manager: VectorStoreManager,
    openai_api_key: Optional[str] = None,
    anthropic_api_key: Optional[str] = None,
    ollama_base_url: str = "http://localhost:11434",
    openai_model: str = "gpt-3.5-turbo",
    anthropic_model: str = "claude-3-5-sonnet-20241022",
    ollama_model: str = "llama2"
) -> RAGEngine:
    """
    Initialize global RAG engine with providers

    Args:
        vector_store_manager: Vector store manager
        openai_api_key: OpenAI API key (optional)
        anthropic_api_key: Anthropic API key (optional)
        ollama_base_url: Ollama server URL
        openai_model: OpenAI model name
        anthropic_model: Anthropic model name
        ollama_model: Ollama model name

    Returns:
        Initialized RAG engine
    """
    global rag_engine

    engine = RAGEngine(vector_store_manager)

    # Register OpenAI if API key provided
    if openai_api_key:
        try:
            provider = OpenAIProvider(api_key=openai_api_key, model=openai_model)
            engine.register_provider("openai", provider)
        except Exception as e:
            logger.warning(f"Failed to initialize OpenAI: {e}")

    # Register Anthropic if API key provided
    if anthropic_api_key:
        try:
            provider = AnthropicProvider(api_key=anthropic_api_key, model=anthropic_model)
            engine.register_provider("anthropic", provider)
        except Exception as e:
            logger.warning(f"Failed to initialize Anthropic: {e}")

    # Register Ollama (local, no API key needed)
    try:
        provider = OllamaProvider(model=ollama_model, base_url=ollama_base_url)
        engine.register_provider("ollama", provider)
    except Exception as e:
        logger.warning(f"Failed to initialize Ollama: {e}")

    rag_engine = engine
    logger.info(f"RAG engine initialized with providers: {engine.get_available_providers()}")

    return engine
