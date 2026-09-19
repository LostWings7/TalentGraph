"""Embedding generation and vector operations service.

Uses dedicated Gemini embedding model (e.g. gemini-embedding-001) when available,
with a deterministic TF-IDF vectorizer fallback when offline.
"""
import os
import math
import logging
import hashlib
import re
from typing import List, Sequence
from django.conf import settings
from apps.ai.model_config import GEMINI_EMBEDDING_MODEL, AI_ENABLED
from apps.ai.gemini_client import get_gemini_client
from apps.core.math_utils import cosine_similarity

logger = logging.getLogger(__name__)

# Dimension for deterministic hashing vectorizer
FALLBACK_DIMENSION = 256

STOPWORDS = {
    'a', 'an', 'the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'of', 'from', 'as', 'into', 'about', 'across', 'after'
}

def get_text_embedding(text: str) -> List[float]:
    """Generate embedding vector for a given text string.
    
    Tries dedicated Gemini Embedding model first; falls back to deterministic vectorizer.
    """
    if not text or not text.strip():
        return [0.0] * FALLBACK_DIMENSION

    client = get_gemini_client()
    if client is not None:
        try:
            result = client.models.embed_content(
                model=GEMINI_EMBEDDING_MODEL,
                contents=text,
            )
            if result and hasattr(result, 'embedding') and hasattr(result.embedding, 'values'):
                return [float(v) for v in result.embedding.values]
            if result and hasattr(result, 'embeddings') and len(result.embeddings) > 0:
                return [float(v) for v in result.embeddings[0].values]
        except Exception as e:
            logger.warning(f"Gemini embedding API call failed: {e}. Using deterministic fallback vectorizer.")

    return _generate_fallback_embedding(text)

def _generate_fallback_embedding(text: str, dimension: int = FALLBACK_DIMENSION) -> List[float]:
    """Deterministic token-frequency hashing vectorizer for offline embedding."""
    vector = [0.0] * dimension
    
    # Clean and tokenize
    cleaned = re.sub(r'[^a-zA-Z0-9\s]', ' ', text.lower())
    tokens = [t.strip() for t in cleaned.split() if t.strip() and t.strip() not in STOPWORDS]
    
    if not tokens:
        return vector

    # Build token n-grams and hashed frequencies
    for i, token in enumerate(tokens):
        # Unigram hash
        h = int(hashlib.sha256(token.encode('utf-8')).hexdigest(), 16) % dimension
        vector[h] += 2.0
        
        # Bigram hash for phrase context
        if i < len(tokens) - 1:
            bigram = f"{token}_{tokens[i+1]}"
            hb = int(hashlib.sha256(bigram.encode('utf-8')).hexdigest(), 16) % dimension
            vector[hb] += 3.0

        # Trigram hash
        if i < len(tokens) - 2:
            trigram = f"{token}_{tokens[i+1]}_{tokens[i+2]}"
            ht = int(hashlib.sha256(trigram.encode('utf-8')).hexdigest(), 16) % dimension
            vector[ht] += 4.0

    # L2 Normalization
    norm = math.sqrt(sum(x * x for x in vector))
    if norm > 0:
        vector = [round(x / norm, 6) for x in vector]
    
    return vector

def compute_semantic_similarity(vec_a: Sequence[float], vec_b: Sequence[float]) -> float:
    """Compute normalized cosine similarity score between two embedding vectors."""
    return cosine_similarity(vec_a, vec_b)
