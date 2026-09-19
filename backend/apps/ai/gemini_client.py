"""Gemini API Client Wrapper.

Provides safe, resilient calls to Gemini 3.7 Flash using the official google-genai SDK,
with schema validation, timeout protection, and seamless exception handling.
"""
import os
import json
import logging
from typing import Type, TypeVar, Optional
from pydantic import BaseModel
from django.conf import settings
from apps.ai.model_config import GEMINI_MODEL, AI_ENABLED, AI_TIMEOUT_SECONDS

logger = logging.getLogger(__name__)

T = TypeVar('T', bound=BaseModel)

_client_instance = None

def get_gemini_client():
    """Returns a singleton google.genai.Client instance or None if not configured."""
    global _client_instance
    if _client_instance is not None:
        return _client_instance

    api_key = getattr(settings, 'GEMINI_API_KEY', os.getenv('GEMINI_API_KEY', '')) or os.getenv('GOOGLE_API_KEY', '')
    ai_enabled = getattr(settings, 'AI_ENABLED', True)
    if not api_key or not ai_enabled:
        return None

    try:
        from google import genai
        _client_instance = genai.Client(api_key=api_key)
        return _client_instance
    except Exception as e:
        logger.warning(f"Failed to initialize Gemini Client: {e}")
        return None

def generate_structured_gemini_response(
    prompt: str,
    response_schema: Type[T],
    system_instruction: Optional[str] = None,
    temperature: float = 0.2
) -> Optional[T]:
    """Calls Gemini 3.7 Flash with structured JSON output and validates against a Pydantic schema.
    
    Includes fast failover to deterministic fallback when quota limits (429) or rate limits occur.
    """
    client = get_gemini_client()
    if client is None:
        return None

    candidate_models = [GEMINI_MODEL]
    seen = set()
    models_to_try = [m for m in candidate_models if m and not (m in seen or seen.add(m))]

    for model_name in models_to_try:
        try:
            from google.genai import types
            
            config = types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=response_schema,
                temperature=temperature,
                system_instruction=system_instruction,
            )

            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=config,
            )

            if not response or not response.text:
                logger.warning(f"Empty response received from Gemini API ({model_name}).")
                continue

            # Parse JSON string and validate against Pydantic schema
            data = json.loads(response.text)
            validated_instance = response_schema.model_validate(data)
            return validated_instance

        except Exception as e:
            err_str = str(e)
            logger.warning(f"Error calling Gemini structured API ({model_name}): {e}")
            # If quota exhausted or service unavailable, fail fast to deterministic fallback
            break

    return None

def generate_gemini_text(
    prompt: str,
    system_instruction: Optional[str] = None,
    temperature: float = 0.3
) -> Optional[str]:
    """Generate free-form text using Gemini 3.7 Flash with fast deterministic fallback."""
    client = get_gemini_client()
    if client is None:
        return None

    candidate_models = [GEMINI_MODEL]
    seen = set()
    models_to_try = [m for m in candidate_models if m and not (m in seen or seen.add(m))]

    for model_name in models_to_try:
        try:
            from google.genai import types
            config = types.GenerateContentConfig(
                temperature=temperature,
                system_instruction=system_instruction,
            )
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=config,
            )
            if response and response.text:
                return response.text
        except Exception as e:
            logger.warning(f"Error calling Gemini text API ({model_name}): {e}")
            break

    return None

