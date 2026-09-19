import logging
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone

from apps.projects.models import Project, ProjectContribution, StaffingRequest, StaffingRecommendation
from apps.projects.serializers import (
    ProjectSerializer,
    ProjectContributionSerializer,
    StaffingRequestSerializer,
    StaffingRecommendationSerializer
)
from apps.core.permissions import IsHRAdmin, CanAccessProjectObject
from apps.core.audit import log_audit_event
from apps.core.models import Enterprise, ApprovalRequest
from apps.core.approval_service import ApprovalService
from apps.employees.models import Employee, EmployeeSkill
from apps.skills.models import Skill
from apps.core.normalization import normalize_skill_name
from apps.projects.staffing_service import StaffingEngine

logger = logging.getLogger(__name__)

class ProjectListView(generics.ListCreateAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        profile = getattr(user, 'profile', None)
        enterprise = profile.enterprise if profile else Enterprise.objects.first()

        qs = Project.objects.filter(enterprise=enterprise)

        # If user is an employee, filter by visibility
        if profile and profile.is_employee and profile.employee:
            emp = profile.employee
            # Employees can see ENTERPRISE_PUBLIC projects OR projects where they are a contributor
            qs = qs.filter(
                Q(sensitivity_level='ENTERPRISE_PUBLIC') |
                Q(contributors__employee=emp)
            ).distinct()

        dept = self.request.query_params.get('department')
        if dept:
            qs = qs.filter(department=dept)

        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(technologies__icontains=search))

        return qs

    def perform_create(self, serializer):
        profile = getattr(self.request.user, 'profile', None)
        enterprise = profile.enterprise if profile else Enterprise.objects.first()
        project = serializer.save(enterprise=enterprise, created_by=self.request.user)

        log_audit_event(
            enterprise=enterprise,
            actor=self.request.user,
            action='PROJECT_CREATED',
            target_model='Project',
            target_id=str(project.id),
            details={
                'name': project.name,
                'sensitivity': project.sensitivity_level,
                'department': project.department
            }
        )

        # Handle initial contributors if provided in payload
        contributors_data = self.request.data.get('contributors', [])
        for c in contributors_data:
            emp_id = c.get('employee_id')
            if emp_id:
                emp = Employee.objects.filter(id=emp_id, enterprise=enterprise).first()
                if emp:
                    ProjectContribution.objects.create(
                        employee=emp,
                        project=project,
                        role_in_project=c.get('role_in_project', 'Core Contributor'),
                        contribution_summary=c.get('contribution_summary', f"Assigned to {project.name}"),
                        evidence=c.get('evidence', f"Assigned by HR as key project contributor"),
                        allocation_pct=float(c.get('allocation_pct', 0.5)),
                        verification_status='approved',
                        verified_by=self.request.user,
                        verified_at=timezone.now()
                    )

class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated, CanAccessProjectObject]

    def get_queryset(self):
        profile = getattr(self.request.user, 'profile', None)
        enterprise = profile.enterprise if profile else Enterprise.objects.first()
        return Project.objects.filter(enterprise=enterprise)

    def perform_update(self, serializer):
        project = serializer.save()
        profile = getattr(self.request.user, 'profile', None)
        enterprise = profile.enterprise if profile else Enterprise.objects.first()
        log_audit_event(
            enterprise=enterprise,
            actor=self.request.user,
            action='PROJECT_UPDATED',
            target_model='Project',
            target_id=str(project.id),
            details={'name': project.name}
        )

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def project_contributors_view(request, project_id):
    """
    GET: List contributors for project.
    POST: Assign contributors (HR) or Employee submits contribution to project.
    """
    profile = getattr(request.user, 'profile', None)
    enterprise = profile.enterprise if profile else Enterprise.objects.first()
    project = get_object_or_404(Project, id=project_id, enterprise=enterprise)

    if request.method == 'GET':
        contributions = project.contributors.select_related('employee').all()
        serializer = ProjectContributionSerializer(contributions, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        data = request.data
        if profile and profile.is_hr:
            # HR directly assigns contributor
            emp_id = data.get('employee_id')
            emp = get_object_or_404(Employee, id=emp_id, enterprise=enterprise)
            
            contrib, created = ProjectContribution.objects.update_or_create(
                employee=emp,
                project=project,
                defaults={
                    'role_in_project': data.get('role_in_project', 'Core Contributor'),
                    'contribution_summary': data.get('contribution_summary', 'Core engineering contributor'),
                    'evidence': data.get('evidence', 'Assigned directly by HR'),
                    'allocation_pct': float(data.get('allocation_pct', 0.5)),
                    'verification_status': 'approved',
                    'verified_by': request.user,
                    'verified_at': timezone.now()
                }
            )

            log_audit_event(
                enterprise=enterprise,
                actor=request.user,
                action='CONTRIBUTOR_ASSIGNED',
                target_model='ProjectContribution',
                target_id=str(contrib.id),
                details={'project': project.name, 'employee': emp.name}
            )

            return Response(ProjectContributionSerializer(contrib).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

        else:
            # Employee self-submits contribution -> Enters Pending Approval
            if not profile or not profile.employee:
                return Response({'error': 'Employee profile required.'}, status=status.HTTP_400_BAD_REQUEST)

            emp = profile.employee
            contrib, created = ProjectContribution.objects.update_or_create(
                employee=emp,
                project=project,
                defaults={
                    'role_in_project': data.get('role_in_project', 'Contributor'),
                    'contribution_summary': data.get('contribution_summary', ''),
                    'evidence': data.get('evidence', ''),
                    'allocation_pct': float(data.get('allocation_pct', 0.5)),
                    'technologies_demonstrated': data.get('technologies_demonstrated', ''),
                    'verification_status': 'pending',
                    'submitted_by': request.user
                }
            )

            # Create Approval Request for HR
            ApprovalService.create_request(
                enterprise=enterprise,
                requester=request.user,
                request_type='project_contribution',
                title=f"{emp.name} submitted contribution for {project.name}",
                description=f"Role: {contrib.role_in_project}\nSummary: {contrib.contribution_summary}\nEvidence: {contrib.evidence}",
                payload={
                    'employee_id': emp.id,
                    'project_id': project.id,
                    'contribution_id': contrib.id,
                    'technologies': contrib.technologies_demonstrated
                }
            )

            return Response(ProjectContributionSerializer(contrib).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsHRAdmin])
def project_assign_contributor_view(request, project_id, employee_id):
    """Directly assign an employee as contributor to a project."""
    profile = getattr(request.user, 'profile', None)
    enterprise = profile.enterprise if profile else Enterprise.objects.first()
    project = get_object_or_404(Project, id=project_id, enterprise=enterprise)
    emp = get_object_or_404(Employee, id=employee_id, enterprise=enterprise)
    data = request.data

    contrib, created = ProjectContribution.objects.update_or_create(
        employee=emp,
        project=project,
        defaults={
            'role_in_project': data.get('role_in_project', 'Core Contributor'),
            'contribution_summary': data.get('contribution_summary', 'Assigned directly by HR'),
            'evidence': data.get('evidence', 'Assigned by HR Admin'),
            'allocation_pct': float(data.get('allocation_pct', 0.5)),
            'verification_status': 'approved',
            'verified_by': request.user,
            'verified_at': timezone.now()
        }
    )

    log_audit_event(
        enterprise=enterprise,
        actor=request.user,
        action='CONTRIBUTOR_ASSIGNED',
        target_model='ProjectContribution',
        target_id=str(contrib.id),
        details={'project': project.name, 'employee': emp.name}
    )

    return Response({'success': True, 'contribution': ProjectContributionSerializer(contrib).data}, status=status.HTTP_200_OK)


class EmployeeContributionsListView(generics.ListAPIView):
    serializer_class = ProjectContributionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        employee_id = self.kwargs.get('employee_id')
        profile = getattr(self.request.user, 'profile', None)
        enterprise = profile.enterprise if profile else Enterprise.objects.first()

        # Employee can only view their own contributions unless HR
        if profile and profile.is_employee:
            if str(profile.employee_id) != str(employee_id):
                return ProjectContribution.objects.none()

        return ProjectContribution.objects.filter(
            employee_id=employee_id,
            employee__enterprise=enterprise
        ).select_related('project', 'employee')

# --- Staffing Endpoints ---

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsHRAdmin])
def staffing_requests_list_create(request):
    """List all staffing requests for the enterprise or create a new one."""
    profile = getattr(request.user, 'profile', None)
    enterprise = profile.enterprise if profile else Enterprise.objects.first()

    if request.method == 'GET':
        requests = StaffingRequest.objects.filter(enterprise=enterprise)
        serializer = StaffingRequestSerializer(requests, many=True)
        return Response({'results': serializer.data})

    elif request.method == 'POST':
        data = request.data
        proj_id = data.get('project_id')
        project = Project.objects.filter(id=proj_id, enterprise=enterprise).first() if proj_id else None

        req = StaffingRequest.objects.create(
            enterprise=enterprise,
            project=project,
            project_title=data.get('project_title', project.name if project else 'Technical Project'),
            department=data.get('department', project.department if project else 'Engineering'),
            requested_by=request.user,
            team_size=int(data.get('team_size', 5)),
            required_skills=data.get('required_skills', []),
            minimum_experience=float(data.get('minimum_experience', 2.0)),
            duration_months=int(data.get('duration_months', 3)),
            description=data.get('description', project.description if project else ''),
            weights_config=data.get('weights_config', {})
        )

        log_audit_event(
            enterprise=enterprise,
            actor=request.user,
            action='STAFFING_REQUEST_CREATED',
            target_model='StaffingRequest',
            target_id=str(req.id),
            details={'project_title': req.project_title, 'team_size': req.team_size}
        )

        return Response(StaffingRequestSerializer(req).data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsHRAdmin])
def staffing_analyze_view(request, request_id):
    """
    Runs deterministic multi-factor candidate scoring and grounded explainability
    for a staffing request within the enterprise.
    """
    profile = getattr(request.user, 'profile', None)
    enterprise = profile.enterprise if profile else Enterprise.objects.first()
    staff_req = get_object_or_404(StaffingRequest, id=request_id, enterprise=enterprise)

    weights = request.data.get('weights', staff_req.weights_config or None)

    candidates = StaffingEngine.rank_candidates_for_enterprise(
        enterprise=enterprise,
        required_skills=staff_req.required_skills,
        minimum_experience=staff_req.minimum_experience,
        project_description=staff_req.description,
        weights=weights,
        limit=20
    )

    ai_mode = staff_req.project.ai_processing_mode if staff_req.project else 'AI_ALLOWED'

    # Save or update StaffingRecommendation objects
    saved_recs = []
    for cand in candidates:
        emp = Employee.objects.filter(id=cand['employee_id']).first()
        if emp:
            explanation = StaffingEngine.generate_candidate_explanation(
                candidate_score=cand,
                project_title=staff_req.project_title,
                project_description=staff_req.description,
                ai_processing_mode=ai_mode
            )
            cand['explanation'] = explanation

            rec, _ = StaffingRecommendation.objects.update_or_create(
                staffing_request=staff_req,
                employee=emp,
                defaults={
                    'overall_score': cand['overall_score'],
                    'skill_score': cand['skill_score'],
                    'experience_score': cand['experience_score'],
                    'project_score': cand['project_score'],
                    'evidence_score': cand['evidence_score'],
                    'freshness_score': cand['freshness_score'],
                    'availability_score': cand['availability_score'],
                    'matched_skills': cand['matched_skills'],
                    'missing_skills': cand['missing_skills'],
                    'explanation': explanation,
                    'rank': cand['rank'],
                }
            )
            saved_recs.append(rec)

    log_audit_event(
        enterprise=enterprise,
        actor=request.user,
        action='STAFFING_ANALYSIS_EXECUTED',
        target_model='StaffingRequest',
        target_id=str(staff_req.id),
        details={'candidates_evaluated': len(candidates)}
    )

    serializer = StaffingRecommendationSerializer(saved_recs, many=True)
    return Response({
        'staffing_request_id': staff_req.id,
        'project_title': staff_req.project_title,
        'results': serializer.data,
        'total_evaluated': len(candidates)
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsHRAdmin])
def staffing_team_builder_view(request, request_id):
    """Builds a complementary squad for the staffing request."""
    profile = getattr(request.user, 'profile', None)
    enterprise = profile.enterprise if profile else Enterprise.objects.first()
    staff_req = get_object_or_404(StaffingRequest, id=request_id, enterprise=enterprise)

    team_size = int(request.data.get('team_size', staff_req.team_size))

    team_data = StaffingEngine.build_optimal_team(
        enterprise=enterprise,
        required_skills=staff_req.required_skills,
        team_size=team_size,
        minimum_experience=staff_req.minimum_experience,
        project_description=staff_req.description
    )

    return Response(team_data)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsHRAdmin])
def staffing_assign_candidate_view(request, request_id, employee_id):
    """Assigns an employee to the project from staffing recommendations."""
    profile = getattr(request.user, 'profile', None)
    enterprise = profile.enterprise if profile else Enterprise.objects.first()
    staff_req = get_object_or_404(StaffingRequest, id=request_id, enterprise=enterprise)
    emp = get_object_or_404(Employee, id=employee_id, enterprise=enterprise)

    role_title = request.data.get('role_in_project', 'Project Specialist')
    allocation_pct = float(request.data.get('allocation_pct', 0.5))

    # Update recommendation status
    rec = StaffingRecommendation.objects.filter(staffing_request=staff_req, employee=emp).first()
    if rec:
        rec.status = 'Assigned'
        rec.save()

    # If project attached, create contribution
    if staff_req.project:
        contrib, _ = ProjectContribution.objects.update_or_create(
            employee=emp,
            project=staff_req.project,
            defaults={
                'role_in_project': role_title,
                'contribution_summary': f"Staffed onto {staff_req.project_title} via AI Staffing Engine.",
                'evidence': f"Assigned by HR ({request.user.get_full_name() or request.user.username}) based on technical match.",
                'allocation_pct': allocation_pct,
                'verification_status': 'approved',
                'verified_by': request.user,
                'verified_at': timezone.now()
            }
        )

    # Adjust employee capacity
    emp.current_allocation_pct = min(1.0, emp.current_allocation_pct + allocation_pct)
    emp.availability_pct = max(0.0, 1.0 - emp.current_allocation_pct)
    emp.save(update_fields=['current_allocation_pct', 'availability_pct'])

    log_audit_event(
        enterprise=enterprise,
        actor=request.user,
        action='STAFFING_CANDIDATE_ASSIGNED',
        target_model='ProjectContribution',
        target_id=str(emp.id),
        details={
            'project': staff_req.project_title,
            'employee': emp.name,
            'role': role_title,
            'allocation': allocation_pct
        }
    )

    return Response({
        'success': True,
        'message': f"Assigned {emp.name} to {staff_req.project_title}.",
        'employee_id': emp.id,
        'new_availability_pct': int(emp.availability_pct * 100)
    })
