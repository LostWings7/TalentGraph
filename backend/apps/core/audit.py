import logging
from typing import Optional, Dict, Any
from django.contrib.auth.models import User
from apps.core.models import Enterprise, AuditLog

logger = logging.getLogger(__name__)

def log_audit_event(
    enterprise: Enterprise,
    action: str,
    actor: Optional[User] = None,
    actor_name: str = '',
    target_model: str = '',
    target_id: str = '',
    details: Optional[Dict[str, Any]] = None
) -> Optional[AuditLog]:
    """Record an enterprise talent action in the audit trail."""
    try:
        if not actor_name and actor:
            actor_name = actor.get_full_name() or actor.username
        if not actor_name:
            actor_name = 'System'

        return AuditLog.objects.create(
            enterprise=enterprise,
            actor=actor,
            actor_name=actor_name,
            action=action,
            target_model=target_model,
            target_id=str(target_id),
            details=details or {}
        )
    except Exception as e:
        logger.exception(f"Failed to record audit log event '{action}': {e}")
        return None
