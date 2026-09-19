"""Persona & Employee Account Creation Service.

Persists candidate talent personas into Django SQLite database, creates secure User
credentials with temporary password flag, links enterprise ownership, skills, evidence,
projects, learning enrollments, generates vector embeddings, and computes full hybrid role matches.
"""
import logging
import secrets
from typing import Dict, Any, Optional
from django.db import transaction
from django.contrib.auth.models import User
from apps.employees.models import Employee, EmployeeSkill, CareerGoal
from apps.skills.models import Skill
from apps.projects.models import Project, ProjectContribution
from apps.learning.models import LearningResource, EmployeeLearning
from apps.roles.models import Role
from apps.core.models import Enterprise, UserProfile
from apps.core.audit import log_audit_event
from apps.mobility.matching_service import rank_roles_for_employee
from apps.ai.embeddings import get_text_embedding
from apps.ai.profile_builder import build_employee_text_context
from apps.core.normalization import normalize_skill_name

logger = logging.getLogger(__name__)

DEFAULT_AVATARS = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
]

class PersonaCreationService:
    @staticmethod
    @transaction.atomic
    def create_or_update_persona(
        persona_data: Dict[str, Any],
        enterprise: Optional[Enterprise] = None,
        creator_user: Optional[User] = None
    ) -> Dict[str, Any]:
        """Creates or updates an Employee record and generates a real enterprise employee login account."""
        if not enterprise:
            enterprise = Enterprise.objects.first()
            if not enterprise:
                enterprise = Enterprise.objects.create(name='NovaTech Solutions', slug='novatech-solutions')

        name = persona_data.get('name', 'New Talent Persona').strip()
        email = persona_data.get('email', f"{name.lower().replace(' ', '.')}@novatech.demo").strip()
        department = persona_data.get('department', 'Engineering')
        current_role = persona_data.get('current_role', 'Software Engineer')
        years_exp = float(persona_data.get('years_experience', 3.0))
        education = persona_data.get('education', '')
        certifications_summary = persona_data.get('certifications_summary', '')
        bio = persona_data.get('bio', '')
        interests = persona_data.get('interests', '')
        avatar_url = persona_data.get('avatar_url')
        availability_pct = float(persona_data.get('availability_pct', 1.0))

        if not avatar_url:
            avatar_url = DEFAULT_AVATARS[abs(hash(name)) % len(DEFAULT_AVATARS)]

        # 1. Create or Update Employee
        employee, created = Employee.objects.update_or_create(
            email=email,
            defaults={
                'enterprise': enterprise,
                'name': name,
                'department': department,
                'current_role': current_role,
                'years_experience': years_exp,
                'education': education,
                'certifications': certifications_summary,
                'bio': bio,
                'interests': interests,
                'avatar_url': avatar_url,
                'availability_pct': availability_pct,
            }
        )

        # 2. Process Skills
        skills_created_count = 0
        skills_list = persona_data.get('skills', [])
        for item in skills_list:
            raw_name = item.get('name', '').strip()
            if not raw_name:
                continue
            
            norm_name = normalize_skill_name(raw_name)
            category = item.get('category', 'Backend')
            
            valid_categories = ['AI/ML', 'Backend', 'Frontend', 'Data Engineering', 'Cloud & DevOps', 'Security', 'Leadership & Product']
            if category not in valid_categories:
                category = 'Backend'

            skill, _ = Skill.objects.get_or_create(
                name=norm_name,
                defaults={
                    'category': category,
                    'market_trend': 'Growing',
                    'description': f"Core competency in {norm_name}",
                    'enterprise': enterprise
                }
            )

            proficiency = item.get('proficiency', 'Intermediate')
            if proficiency not in ['Beginner', 'Intermediate', 'Advanced', 'Expert']:
                proficiency = 'Intermediate'

            confidence = float(item.get('confidence', 0.85))
            confidence = max(0.0, min(1.0, confidence))

            source = item.get('source', 'explicit')
            if source not in ['explicit', 'project_inferred', 'learning', 'ai_discovered']:
                source = 'explicit'

            evidence = item.get('evidence', '')

            EmployeeSkill.objects.update_or_create(
                employee=employee,
                skill=skill,
                defaults={
                    'proficiency': proficiency,
                    'confidence': confidence,
                    'source': source,
                    'evidence': evidence,
                    'verification_status': 'hr_verified' if creator_user else 'self_reported'
                }
            )
            skills_created_count += 1

        # 3. Process Projects
        projects_created_count = 0
        projects_list = persona_data.get('projects', [])
        for p_item in projects_list:
            p_name = p_item.get('project_name', '').strip()
            if not p_name:
                continue

            techs = p_item.get('technologies', '')
            outcomes = p_item.get('outcomes', '')
            duration = int(p_item.get('duration_months', 6))
            evidence = p_item.get('evidence', outcomes)
            role_in_proj = p_item.get('role_in_project', 'Core Contributor')

            project, _ = Project.objects.update_or_create(
                name=p_name,
                enterprise=enterprise,
                defaults={
                    'description': outcomes or f"Strategic project: {p_name}",
                    'technologies': techs,
                    'outcomes': outcomes,
                    'duration_months': duration,
                    'sensitivity_level': 'ENTERPRISE_PUBLIC'
                }
            )

            ProjectContribution.objects.update_or_create(
                employee=employee,
                project=project,
                defaults={
                    'role_in_project': role_in_proj,
                    'contribution_summary': outcomes,
                    'evidence': evidence,
                    'verification_status': 'approved'
                }
            )
            projects_created_count += 1

        # 4. Process Learning
        learning_count = 0
        learning_list = persona_data.get('learning', [])
        for l_item in learning_list:
            l_title = l_item.get('title', '').strip()
            if not l_title:
                continue

            provider = l_item.get('provider', 'Internal Academy')
            diff = l_item.get('difficulty', 'Intermediate')
            cert_name = l_item.get('certification_name', '')
            status = l_item.get('status', 'Completed')
            outcome = l_item.get('outcome', '')

            resource, _ = LearningResource.objects.get_or_create(
                title=l_title,
                enterprise=enterprise,
                defaults={
                    'provider': provider,
                    'difficulty': diff,
                    'description': l_item.get('skills_acquired', l_title),
                    'certification_name': cert_name,
                    'duration_hours': 12,
                }
            )

            EmployeeLearning.objects.update_or_create(
                employee=employee,
                resource=resource,
                defaults={
                    'status': status,
                    'outcome': outcome,
                }
            )
            learning_count += 1

        # 5. Process Career Goal
        target_role_title = persona_data.get('target_role')
        if target_role_title:
            matching_role = Role.objects.filter(
                title__icontains=target_role_title.strip()
            ).filter(enterprise=enterprise).first()
            CareerGoal.objects.update_or_create(
                employee=employee,
                defaults={
                    'target_role_title': target_role_title,
                    'target_role_id': matching_role.id if matching_role else None,
                    'notes': f"Target career trajectory set during employee creation."
                }
            )

        # 6. Generate Text Embedding
        emp_text = build_employee_text_context(employee)
        embedding_vec = get_text_embedding(emp_text)
        employee.embedding = embedding_vec
        employee.save(update_fields=['embedding'])

        # 7. Create or Link Django User & UserProfile with Secure Temporary Password
        temporary_password = persona_data.get('password') or f"TempPass2026!"
        username = email.split('@')[0]

        user = User.objects.filter(email=email).first()
        if not user:
            user = User.objects.filter(username=username).first()

        if not user:
            first_name = name.split()[0] if name else ''
            last_name = " ".join(name.split()[1:]) if len(name.split()) > 1 else ''
            user = User.objects.create_user(
                username=username,
                email=email,
                password=temporary_password,
                first_name=first_name,
                last_name=last_name
            )
        else:
            user.set_password(temporary_password)
            user.save()

        user_profile, _ = UserProfile.objects.update_or_create(
            user=user,
            defaults={
                'enterprise': enterprise,
                'role': 'employee',
                'employee': employee,
                'is_temporary_password': True,
                'title': current_role
            }
        )

        log_audit_event(
            enterprise=enterprise,
            actor=creator_user or user,
            action='EMPLOYEE_ACCOUNT_CREATED',
            target_model='Employee',
            target_id=str(employee.id),
            details={'name': employee.name, 'email': employee.email, 'department': employee.department}
        )

        # 8. Compute Initial Role Matches
        ranked_matches = rank_roles_for_employee(employee, top_n=15)

        return {
            'success': True,
            'is_new': created,
            'employee': {
                'id': employee.id,
                'name': employee.name,
                'email': employee.email,
                'department': employee.department,
                'current_role': employee.current_role,
                'years_experience': employee.years_experience,
                'bio': employee.bio,
                'avatar_url': employee.avatar_url,
                'availability_pct': int(employee.availability_pct * 100),
                'skills_count': skills_created_count,
                'projects_count': projects_created_count,
                'learning_count': learning_count,
            },
            'account': {
                'login_email': employee.email,
                'temporary_password': temporary_password,
                'login_url': '/login',
                'is_temporary_password': True
            },
            'top_role_match': ranked_matches[0] if ranked_matches else None,
            'matches_count': len(ranked_matches),
            'message': f"Employee account for '{employee.name}' successfully activated with {skills_created_count} skills and login credentials created."
        }
