"""
LLM Provider Interface
Phase 6: Universal provider architecture supporting OpenAI, Anthropic, and Ollama
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)


class LLMProvider(ABC):
    """
    Abstract base class for LLM providers
    Defines common interface for all providers (OpenAI, Anthropic, Ollama)
    """

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        """
        Initialize LLM provider

        Args:
            api_key: API key for cloud providers (not needed for Ollama)
            model: Model name/identifier
        """
        self.api_key = api_key
        self.model = model
        self.provider_name = self.__class__.__name__.replace("Provider", "")

    @abstractmethod
    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1000,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate text completion from prompt

        Args:
            prompt: User prompt/question
            system_prompt: System instruction (optional)
            temperature: Sampling temperature (0.0 - 1.0)
            max_tokens: Maximum tokens to generate
            **kwargs: Provider-specific parameters

        Returns:
            Dict with:
                - text: Generated text response
                - model: Model used
                - usage: Token usage statistics
                - provider: Provider name
        """
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """
        Check if provider is available and configured

        Returns:
            True if provider can be used, False otherwise
        """
        pass

    @abstractmethod
    def get_models(self) -> List[str]:
        """
        Get list of available models for this provider

        Returns:
            List of model identifiers
        """
        pass

    def format_context(self, context_chunks: List[Dict[str, Any]]) -> str:
        """
        Format retrieved context chunks into a single string

        Args:
            context_chunks: List of retrieved chunks with text and metadata

        Returns:
            Formatted context string
        """
        if not context_chunks:
            return "No relevant context found."

        formatted = "Relevant context:\n\n"
        for i, chunk in enumerate(context_chunks, 1):
            text = chunk.get("text", "")
            metadata = chunk.get("metadata", {})

            formatted += f"[{i}] "
            if metadata.get("filename"):
                formatted += f"From {metadata['filename']}: "
            formatted += f"{text}\n\n"

        return formatted

    def build_rag_prompt(
        self,
        question: str,
        context_chunks: List[Dict[str, Any]],
        system_prompt: Optional[str] = None
    ) -> tuple[str, str]:
        """
        Build RAG prompt with context and question

        Args:
            question: User question
            context_chunks: Retrieved context chunks
            system_prompt: Optional system prompt override

        Returns:
            Tuple of (system_prompt, user_prompt)
        """
        if system_prompt is None:
            system_prompt = (
                "You are a helpful assistant that answers questions based on the provided context. "
                "Use the context to answer the question accurately. "
                "If the answer is not in the context, say so clearly."
            )

        context = self.format_context(context_chunks)
        user_prompt = f"{context}\n\nQuestion: {question}\n\nAnswer:"

        return system_prompt, user_prompt


class OpenAIProvider(LLMProvider):
    """OpenAI provider (GPT-4, GPT-3.5)"""

    def __init__(self, api_key: str, model: str = "gpt-3.5-turbo"):
        super().__init__(api_key, model)
        self.client = None
        if api_key:
            try:
                from openai import OpenAI
                self.client = OpenAI(api_key=api_key)
                logger.info(f"OpenAI provider initialized with model: {model}")
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI: {e}")

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1000,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate completion using OpenAI API"""
        if not self.client:
            raise RuntimeError("OpenAI client not initialized")

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs
            )

            return {
                "text": response.choices[0].message.content,
                "model": response.model,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens,
                },
                "provider": "OpenAI"
            }
        except Exception as e:
            logger.error(f"OpenAI generation failed: {e}")
            raise

    def is_available(self) -> bool:
        """Check if OpenAI is available"""
        return self.client is not None

    def get_models(self) -> List[str]:
        """Get available OpenAI models"""
        return ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo", "gpt-3.5-turbo-16k"]


class AnthropicProvider(LLMProvider):
    """Anthropic provider (Claude 3.5)"""

    def __init__(self, api_key: str, model: str = "claude-3-5-sonnet-20241022"):
        super().__init__(api_key, model)
        self.client = None
        if api_key:
            try:
                from anthropic import Anthropic
                self.client = Anthropic(api_key=api_key)
                logger.info(f"Anthropic provider initialized with model: {model}")
            except Exception as e:
                logger.error(f"Failed to initialize Anthropic: {e}")

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1000,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate completion using Anthropic API"""
        if not self.client:
            raise RuntimeError("Anthropic client not initialized")

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=max_tokens,
                temperature=temperature,
                system=system_prompt or "",
                messages=[{"role": "user", "content": prompt}],
                **kwargs
            )

            return {
                "text": response.content[0].text,
                "model": response.model,
                "usage": {
                    "prompt_tokens": response.usage.input_tokens,
                    "completion_tokens": response.usage.output_tokens,
                    "total_tokens": response.usage.input_tokens + response.usage.output_tokens,
                },
                "provider": "Anthropic"
            }
        except Exception as e:
            logger.error(f"Anthropic generation failed: {e}")
            raise

    def is_available(self) -> bool:
        """Check if Anthropic is available"""
        return self.client is not None

    def get_models(self) -> List[str]:
        """Get available Anthropic models"""
        return [
            "claude-3-5-sonnet-20241022",
            "claude-3-opus-20240229",
            "claude-3-sonnet-20240229",
            "claude-3-haiku-20240307"
        ]


class OllamaProvider(LLMProvider):
    """Ollama provider (local LLM)"""

    def __init__(self, model: str = "llama2", base_url: str = "http://localhost:11434"):
        super().__init__(api_key=None, model=model)
        self.base_url = base_url
        self.client = None
        try:
            import ollama
            self.client = ollama.Client(host=base_url)
            logger.info(f"Ollama provider initialized with model: {model}")
        except Exception as e:
            logger.error(f"Failed to initialize Ollama: {e}")

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1000,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate completion using Ollama"""
        if not self.client:
            raise RuntimeError("Ollama client not initialized")

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        try:
            response = self.client.chat(
                model=self.model,
                messages=messages,
                options={
                    "temperature": temperature,
                    "num_predict": max_tokens,
                }
            )

            return {
                "text": response["message"]["content"],
                "model": self.model,
                "usage": {
                    "prompt_tokens": response.get("prompt_eval_count", 0),
                    "completion_tokens": response.get("eval_count", 0),
                    "total_tokens": response.get("prompt_eval_count", 0) + response.get("eval_count", 0),
                },
                "provider": "Ollama"
            }
        except Exception as e:
            logger.error(f"Ollama generation failed: {e}")
            raise

    def is_available(self) -> bool:
        """Check if Ollama is available"""
        if not self.client:
            return False
        try:
            # Try to list models to check if server is running
            self.client.list()
            return True
        except Exception:
            return False

    def get_models(self) -> List[str]:
        """Get available Ollama models"""
        if not self.client:
            return []
        try:
            models = self.client.list()
            return [model["name"] for model in models.get("models", [])]
        except Exception as e:
            logger.error(f"Failed to get Ollama models: {e}")
            return ["llama2", "mistral", "codellama", "llama3"]  # Default common models
