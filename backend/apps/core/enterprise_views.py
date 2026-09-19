from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Q

from apps.core.models import Enterprise, ApprovalRequest, AuditLog
from apps.core.serializers import EnterpriseSerializer, ApprovalRequestSerializer, AuditLogSerializer
from apps.core.permissions import IsHRAdmin
from apps.core.approval_service import ApprovalService
from apps.core.audit import log_audit_event
from apps.skills.models import Skill
from apps.employees.models import Employee, EmployeeSkill
from apps.projects.models import Project

@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def enterprise_profile_view(request):
    """Retrieve or update the authenticated user's enterprise profile."""
    profile = getattr(request.user, 'profile', None)
    if not profile:
        return Response({'error': 'User profile not found.'}, status=status.HTTP_404_NOT_FOUND)

    enterprise = profile.enterprise
    if request.method == 'GET':
        return Response(EnterpriseSerializer(enterprise).data)

    # Only HR can update enterprise profile
    if not profile.is_hr:
        return Response({'error': 'Only HR administrators can update company profile.'}, status=status.HTTP_403_FORBIDDEN)

    serializer = EnterpriseSerializer(enterprise, data=request.data, partial=True)
    if serializer.is_valid():
        updated_enterprise = serializer.save()
        log_audit_event(
            enterprise=enterprise,
            actor=request.user,
            action='ENTERPRISE_PROFILE_UPDATED',
            target_model='Enterprise',
            target_id=str(enterprise.id),
            details={'updated_fields': list(request.data.keys())}
        )
        return Response(EnterpriseSerializer(updated_enterprise).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def capability_map_view(request):
    """
    Computes hierarchical organizational capability map for the enterprise:
    Departments -> Categories -> Skills -> { employees_count, verified_count, active_projects_count, shortage_risk }.
    """
    profile = getattr(request.user, 'profile', None)
    if not profile:
        return Response({'error': 'User profile not found.'}, status=status.HTTP_404_NOT_FOUND)

    enterprise = profile.enterprise

    # Query enterprise skills & global skills
    skills = Skill.objects.filter(Q(enterprise=enterprise) | Q(enterprise__isnull=True)).prefetch_related('employee_proficiencies')
    departments = enterprise.departments or ['Engineering', 'AI Research', 'Data Platform', 'Cloud Architecture', 'Product', 'Security']
    employees = Employee.objects.filter(enterprise=enterprise)
    active_projects = Project.objects.filter(enterprise=enterprise, status='Active')

    capability_groups = {}
    
    for category_code, category_name in Skill.CATEGORY_CHOICES:
        category_skills = skills.filter(category=category_code)
        skill_nodes = []

        for s in category_skills:
            emp_skills = EmployeeSkill.objects.filter(skill=s, employee__enterprise=enterprise)
            emp_count = emp_skills.count()
            verified_count = emp_skills.filter(verification_status='hr_verified').count()
            
            # Count projects mentioning this skill
            proj_count = sum(1 for p in active_projects if s.name.lower() in p.technologies.lower())

            # Calculate risk: high if needed but low verified depth
            risk = 'Low'
            if emp_count == 0:
                risk = 'High'
            elif verified_count < 2 and s.market_trend == 'Critical':
                risk = 'Critical'
            elif verified_count < 3:
                risk = 'Medium'

            skill_nodes.append({
                'id': s.id,
                'name': s.name,
                'market_trend': s.market_trend,
                'employee_count': emp_count,
                'verified_count': verified_count,
                'active_projects_count': proj_count,
                'risk_level': risk,
            })

        capability_groups[category_code] = {
            'category_name': category_name,
            'skills_count': len(skill_nodes),
            'total_talent_pool': sum(sn['employee_count'] for sn in skill_nodes),
            'verified_talent_pool': sum(sn['verified_count'] for sn in skill_nodes),
            'skills': skill_nodes
        }

    return Response({
        'enterprise_name': enterprise.name,
        'industry': enterprise.industry,
        'total_employees': employees.count(),
        'departments': departments,
        'capability_groups': capability_groups
    })

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def approvals_list_view(request):
    """
    GET: List approvals for the enterprise (HR sees all, employee sees their own).
    POST: Employee creates a new approval request.
    """
    profile = getattr(request.user, 'profile', None)
    if not profile:
        return Response({'error': 'Profile required'}, status=status.HTTP_404_NOT_FOUND)

    enterprise = profile.enterprise

    if request.method == 'GET':
        status_filter = request.query_params.get('status')
        qs = ApprovalRequest.objects.filter(enterprise=enterprise)
        if not profile.is_hr:
            qs = qs.filter(requester=request.user)
        if status_filter:
            qs = qs.filter(status=status_filter)
        
        serializer = ApprovalRequestSerializer(qs, many=True)
        return Response({
            'results': serializer.data,
            'pending_count': ApprovalRequest.objects.filter(enterprise=enterprise, status='pending').count()
        })

    elif request.method == 'POST':
        data = request.data
        req = ApprovalService.create_request(
            enterprise=enterprise,
            requester=request.user,
            request_type=data.get('request_type', 'project_contribution'),
            title=data.get('title', 'Pending Contribution Review'),
            description=data.get('description', ''),
            payload=data.get('payload', {})
        )
        return Response(ApprovalRequestSerializer(req).data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsHRAdmin])
def resolve_approval_view(request, approval_id):
    """HR resolves (approves or rejects) an approval request."""
    decision = request.data.get('status') # 'approved' or 'rejected'
    notes = request.data.get('reviewer_notes', '')

    if decision not in ['approved', 'rejected']:
        return Response({'error': "Status decision must be 'approved' or 'rejected'."}, status=status.HTTP_400_BAD_REQUEST)

    result = ApprovalService.resolve_request(
        approval_id=approval_id,
        reviewer=request.user,
        status_decision=decision,
        reviewer_notes=notes
    )

    if not result.get('success'):
        return Response({'error': result.get('error')}, status=status.HTTP_400_BAD_REQUEST)

    req = ApprovalRequest.objects.get(id=approval_id)
    return Response(ApprovalRequestSerializer(req).data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsHRAdmin])
def audit_logs_view(request):
    """List enterprise audit log trail for compliance and governance."""
    profile = getattr(request.user, 'profile', None)
    enterprise = profile.enterprise

    limit = int(request.query_params.get('limit', 50))
    action = request.query_params.get('action')

    qs = AuditLog.objects.filter(enterprise=enterprise)
    if action:
        qs = qs.filter(action__icontains=action)

    serializer = AuditLogSerializer(qs[:limit], many=True)
    return Response({'results': serializer.data})
