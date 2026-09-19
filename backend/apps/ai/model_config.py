"""Centralized AI Model and Feature Configuration.

All AI model references, timeout parameters, and feature flags are maintained here.
Mandatory Generative Model: Gemini 3.7 Flash ('gemini-3.7-flash')
"""
import os
from django.conf import settings

from apps.core.constants import MATCHING_WEIGHTS, AI_SETTINGS

# Primary Generative & Reasoning Model (Mandatory Gemini 3.7 Flash)
GEMINI_MODEL = getattr(settings, 'GEMINI_MODEL', os.getenv('GEMINI_MODEL', AI_SETTINGS['primary_model']))

# Dedicated Embedding Model
GEMINI_EMBEDDING_MODEL = getattr(settings, 'GEMINI_EMBEDDING_MODEL', os.getenv('GEMINI_EMBEDDING_MODEL', AI_SETTINGS['embedding_model']))

# Feature Flags & Parameters
AI_ENABLED = getattr(settings, 'AI_ENABLED', os.getenv('AI_ENABLED', 'true').lower() == 'true')
AI_FALLBACK_ENABLED = getattr(settings, 'AI_FALLBACK_ENABLED', os.getenv('AI_FALLBACK_ENABLED', str(AI_SETTINGS['fallback_enabled'])).lower() == 'true')
AI_TIMEOUT_SECONDS = getattr(settings, 'AI_TIMEOUT_SECONDS', int(os.getenv('AI_TIMEOUT_SECONDS', str(AI_SETTINGS['timeout_seconds']))))

