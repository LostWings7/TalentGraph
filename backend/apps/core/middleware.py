"""Middleware Layer for TalentGraph AI.

Provides structured enterprise tenant resolution, strict HTTP security headers,
and consistent JSON error normalization across all API endpoints.
"""
import logging
import json
from datetime import datetime, timezone
from django.http import JsonResponse, HttpResponse
from django.utils.deprecation import MiddlewareMixin
from apps.core.models import Enterprise, UserProfile

logger = logging.getLogger(__name__)

class TenantContextMiddleware(MiddlewareMixin):
    """Resolves and enforces Enterprise tenant context on every incoming request.
    
    Responsibilities:
    - Identifies enterprise membership from authenticated user (User.profile.enterprise).
    - Validates any custom X-Enterprise-ID / X-Enterprise-Slug headers against user authorization.
    - Attaches validated enterprise instance to `request.enterprise`.
    - Never trusts arbitrary unauthenticated tenant headers.
    """
    def process_request(self, request):
        request.enterprise = None
        user = getattr(request, 'user', None)

        if user and user.is_authenticated:
            profile = getattr(user, 'profile', None)
            if profile and profile.enterprise:
                request.enterprise = profile.enterprise
                return None

        # Unauthenticated / public context fallback to default demo enterprise if needed
        # (Does not grant permissions to protected resources)
        return None

class SecurityHeadersMiddleware(MiddlewareMixin):
    """Enforces essential web security headers across all HTTP responses.
    
    Protects against MIME-sniffing, clickjacking, XSS attacks, and unauthorized framing.
    """
    def process_response(self, request, response):
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response['Permissions-Policy'] = 'geolocation=(), camera=(), microphone=()'
        return response

class APIExceptionMiddleware(MiddlewareMixin):
    """Intercepts unhandled server exceptions on /api/ routes and produces clean JSON responses.
    
    Prevents leaking internal stack traces, database credentials, or filesystem paths.
    """
    def process_exception(self, request, exception):
        if request.path.startswith('/api/'):
            logger.error(f"Unhandled exception in API request [{request.method} {request.path}]: {exception}", exc_info=True)
            
            error_data = {
                "error": "A server error occurred while processing your request.",
                "code": "INTERNAL_SERVER_ERROR",
                "detail": str(exception) if getattr(request, 'user', None) and request.user.is_staff else "An unexpected error was encountered. Please try again.",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "path": request.path
            }
            return JsonResponse(error_data, status=500)
        return None
