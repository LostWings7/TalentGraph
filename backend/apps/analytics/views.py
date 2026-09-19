from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.analytics.services import get_workforce_intelligence_dashboard
from apps.core.permissions import IsHRAdmin
from apps.core.models import Enterprise

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsHRAdmin])
def hr_intelligence_dashboard(request):
    """Returns organizational talent intelligence telemetry and AI executive insights for the enterprise."""
    profile = getattr(request.user, 'profile', None) if request.user and request.user.is_authenticated else None
    enterprise = profile.enterprise if profile else Enterprise.objects.first()
    data = get_workforce_intelligence_dashboard(enterprise=enterprise)
    return Response(data)

