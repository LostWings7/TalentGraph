import logging
from typing import Dict, Any, Optional
from django.utils import timezone
from django.contrib.auth.models import User
from apps.core.models import Enterprise, ApprovalRequest
from apps.employees.models import Employee, EmployeeSkill
from apps.projects.models import Project, ProjectContribution
from apps.skills.models import Skill
from apps.core.normalization import normalize_skill_name
from apps.core.audit import log_audit_event
from apps.mobility.matching_service import calculate_role_match
from apps.roles.models import Role

logger = logging.getLogger(__name__)

class ApprovalService:
    @staticmethod
    def create_request(
        enterprise: Enterprise,
        requester: User,
        request_type: str,
        title: str,
        description: str,
        payload: Dict[str, Any]
    ) -> ApprovalRequest:
        """Create a new pending approval request."""
        req = ApprovalRequest.objects.create(
            enterprise=enterprise,
            requester=requester,
            request_type=request_type,
            title=title,
            description=description,
            payload=payload,
            status='pending'
        )
        log_audit_event(
            enterprise=enterprise,
            actor=requester,
            action='APPROVAL_REQUESTED',
            target_model='ApprovalRequest',
            target_id=str(req.id),
            details={'request_type': request_type, 'title': title}
        )
        return req

    @staticmethod
    def resolve_request(
        approval_id: int,
        reviewer: User,
        status_decision: str,
        reviewer_notes: str = ''
    ) -> Dict[str, Any]:
        """Approve or reject a request, triggering corresponding domain model updates."""
        try:
            req = ApprovalRequest.objects.get(id=approval_id)
        except ApprovalRequest.DoesNotExist:
            return {'success': False, 'error': f"Approval request #{approval_id} not found."}

        if req.status != 'pending':
            return {'success': False, 'error': f"Approval request is already {req.status}."}

        req.status = status_decision
        req.reviewer = reviewer
        req.reviewer_notes = reviewer_notes
        req.resolved_at = timezone.now()
        req.save()

        # If approved, apply domain side-effects
        if status_decision == 'approved':
            ApprovalService._apply_approval_side_effects(req, reviewer)

        log_audit_event(
            enterprise=req.enterprise,
            actor=reviewer,
            action=f"APPROVAL_{status_decision.upper()}",
            target_model='ApprovalRequest',
            target_id=str(req.id),
            details={
                'request_type': req.request_type,
                'status': status_decision,
                'notes': reviewer_notes
            }
        )

        return {'success': True, 'approval_id': req.id, 'status': req.status}

    @staticmethod
    def _apply_approval_side_effects(req: ApprovalRequest, reviewer: User):
        """Execute updates on skills, projects, or evidence upon approval."""
        payload = req.payload or {}
        emp_id = payload.get('employee_id')
        if not emp_id and hasattr(req.requester, 'profile') and req.requester.profile.employee:
            emp_id = req.requester.profile.employee.id

        employee = Employee.objects.filter(id=emp_id).first() if emp_id else None

        if req.request_type == 'project_contribution':
            contrib_id = payload.get('contribution_id')
            if contrib_id:
                contrib = ProjectContribution.objects.filter(id=contrib_id).first()
                if contrib:
                    contrib.verification_status = 'approved'
                    contrib.verified_by = reviewer
                    contrib.verified_at = timezone.now()
                    contrib.save()

                    # Extract demonstrated skills and boost employee skills
                    if employee:
                        techs = contrib.project.get_tech_list()
                        for tech in techs:
                            canon = normalize_skill_name(tech)
                            skill_obj = Skill.objects.filter(name=canon).first()
                            if skill_obj:
                                emp_skill, created = EmployeeSkill.objects.get_or_create(
                                    employee=employee,
                                    skill=skill_obj,
                                    defaults={
                                        'proficiency': 'Intermediate',
                                        'confidence': 0.92,
                                        'source': 'project_inferred',
                                        'evidence': f"Demonstrated in HR-verified project {contrib.project.name}",
                                        'verification_status': 'hr_verified',
                                        'verified_by': reviewer,
                                        'verified_at': timezone.now(),
                                        'last_demonstrated_date': timezone.now().date()
                                    }
                                )
                                if not created:
                                    emp_skill.confidence = min(0.98, max(emp_skill.confidence, 0.90) + 0.05)
                                    emp_skill.verification_status = 'hr_verified'
                                    emp_skill.verified_by = reviewer
                                    emp_skill.verified_at = timezone.now()
                                    emp_skill.last_demonstrated_date = timezone.now().date()
                                    emp_skill.save()

                        # Recalculate role matches for this employee
                        for role in Role.objects.filter(enterprise=req.enterprise):
                            calculate_role_match(employee, role, force_refresh=True)

        elif req.request_type == 'evidence_verification':
            skill_id = payload.get('skill_id')
            skill_name = payload.get('skill_name')
            if employee and (skill_id or skill_name):
                emp_skill = None
                if skill_id:
                    emp_skill = EmployeeSkill.objects.filter(employee=employee, skill_id=skill_id).first()
                elif skill_name:
                    emp_skill = EmployeeSkill.objects.filter(employee=employee, skill__name=skill_name).first()

                if emp_skill:
                    emp_skill.verification_status = 'hr_verified'
                    emp_skill.confidence = min(0.98, emp_skill.confidence + 0.10)
                    emp_skill.verified_by = reviewer
                    emp_skill.verified_at = timezone.now()
                    emp_skill.last_demonstrated_date = timezone.now().date()
                    emp_skill.save()

                    # Recalculate role matches
                    for role in Role.objects.filter(enterprise=req.enterprise):
                        calculate_role_match(employee, role, force_refresh=True)
