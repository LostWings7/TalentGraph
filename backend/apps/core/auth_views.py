import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db import transaction

from apps.core.models import Enterprise, UserProfile
from apps.core.serializers import UserProfileSerializer, EnterpriseSerializer
from apps.core.audit import log_audit_event
from apps.employees.models import Employee

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Authenticate user by email or username and return DRF token with profile."""
    username_or_email = request.data.get('email', '') or request.data.get('username', '')
    password = request.data.get('password', '')

    if not username_or_email or not password:
        return Response(
            {'error': 'Email / username and password are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Allow login with either username or email
    user = User.objects.filter(email__iexact=username_or_email).first()
    if not user:
        user = User.objects.filter(username__iexact=username_or_email).first()

    if not user:
        return Response(
            {'error': 'Invalid credentials. User not found.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    authenticated_user = authenticate(username=user.username, password=password)
    if not authenticated_user:
        return Response(
            {'error': 'Invalid email or password.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    # Ensure profile exists
    profile = getattr(authenticated_user, 'profile', None)
    if not profile:
        # Fallback create or find enterprise
        ent = Enterprise.objects.first()
        if not ent:
            ent = Enterprise.objects.create(name='NovaTech Solutions', slug='novatech-solutions')
        
        role = 'hr_admin' if (authenticated_user.is_staff or authenticated_user.is_superuser or 'hr' in authenticated_user.email.lower()) else 'employee'
        emp = Employee.objects.filter(email=authenticated_user.email).first()
        profile = UserProfile.objects.create(
            user=authenticated_user,
            enterprise=ent,
            role=role,
            employee=emp
        )

    token, _ = Token.objects.get_or_create(user=authenticated_user)

    log_audit_event(
        enterprise=profile.enterprise,
        actor=authenticated_user,
        action='USER_LOGIN',
        target_model='User',
        target_id=str(authenticated_user.id),
        details={'role': profile.role, 'email': authenticated_user.email}
    )

    profile_data = UserProfileSerializer(profile).data
    enterprise_data = profile_data.pop('enterprise', None)
    return Response({
        'token': token.key,
        'user': profile_data,
        'enterprise': enterprise_data,
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def logout_view(request):
    """Invalidate current user token if authenticated."""
    if request.user and request.user.is_authenticated:
        try:
            request.user.auth_token.delete()
        except Exception:
            pass
    return Response({'success': True, 'message': 'Successfully logged out.'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    """Return currently authenticated user identity and profile."""
    profile = getattr(request.user, 'profile', None)
    if not profile:
        return Response({'error': 'User profile not found.'}, status=status.HTTP_404_NOT_FOUND)
    profile_data = UserProfileSerializer(profile).data
    # Separate user and enterprise for frontend context
    enterprise_data = profile_data.pop('enterprise', None)
    return Response({
        'user': profile_data,
        'enterprise': enterprise_data,
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    """Allows user (e.g. employee on first login) to update temporary password."""
    user = request.user
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')

    if not new_password or len(new_password) < 6:
        return Response(
            {'error': 'New password must be at least 6 characters long.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    profile = getattr(user, 'profile', None)
    # If temporary password flag is set, allow setting without old password verification if old_password not provided
    if not (profile and profile.is_temporary_password):
        if not old_password or not user.check_password(old_password):
            return Response({'error': 'Current password does not match.'}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save()

    if profile:
        profile.is_temporary_password = False
        profile.save()

        log_audit_event(
            enterprise=profile.enterprise,
            actor=user,
            action='PASSWORD_CHANGED',
            target_model='User',
            target_id=str(user.id),
            details={'email': user.email}
        )

    # Regenerate token
    Token.objects.filter(user=user).delete()
    new_token = Token.objects.create(user=user)

    return Response({
        'success': True,
        'token': new_token.key,
        'message': 'Password successfully changed.'
    })

@api_view(['POST'])
@permission_classes([AllowAny])
@transaction.atomic
def enterprise_setup_view(request):
    """First-time enterprise setup and HR administrator onboarding."""
    data = request.data
    company_name = data.get('company_name', '').strip()
    admin_email = data.get('admin_email', '').strip()
    admin_password = data.get('admin_password', '').strip()
    admin_name = data.get('admin_name', 'HR Administrator').strip()

    if not company_name or not admin_email or not admin_password:
        return Response(
            {'error': 'Company name, admin email, and admin password are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if Enterprise.objects.filter(name__iexact=company_name).exists():
        return Response(
            {'error': f"Enterprise '{company_name}' already exists."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if User.objects.filter(email__iexact=admin_email).exists():
        return Response(
            {'error': f"An account with email '{admin_email}' already exists."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Create Enterprise
    enterprise = Enterprise.objects.create(
        name=company_name,
        legal_name=data.get('legal_name', company_name),
        industry=data.get('industry', 'Technology & Software'),
        description=data.get('description', ''),
        mission=data.get('mission', ''),
        size=data.get('size', '500 - 2,000 employees'),
        departments=data.get('departments', ['Engineering', 'AI Research', 'Data Platform', 'Product', 'Security']),
        locations=data.get('locations', ['San Francisco, CA', 'New York, NY', 'Remote']),
        work_modes=data.get('work_modes', ['Hybrid', 'Remote', 'On-site']),
        website=data.get('website', ''),
        logo_url=data.get('logo_url', '')
    )

    # Create HR Admin User
    first_name = admin_name.split()[0] if admin_name else 'HR'
    last_name = " ".join(admin_name.split()[1:]) if len(admin_name.split()) > 1 else 'Admin'
    username = admin_email.split('@')[0]

    admin_user = User.objects.create_user(
        username=username,
        email=admin_email,
        password=admin_password,
        first_name=first_name,
        last_name=last_name,
        is_staff=True
    )

    profile = UserProfile.objects.create(
        user=admin_user,
        enterprise=enterprise,
        role='hr_admin',
        title='Chief Talent Officer / HR Administrator',
        is_temporary_password=False
    )

    token = Token.objects.create(user=admin_user)

    log_audit_event(
        enterprise=enterprise,
        actor=admin_user,
        action='ENTERPRISE_CREATED',
        target_model='Enterprise',
        target_id=str(enterprise.id),
        details={'name': enterprise.name, 'admin_email': admin_email}
    )

    return Response({
        'success': True,
        'token': token.key,
        'enterprise': EnterpriseSerializer(enterprise).data,
        'user': UserProfileSerializer(profile).data
    }, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([AllowAny])
def demo_accounts_view(request):
    """Lists available demo accounts for instant hackathon walkthrough."""
    demo_list = [
        {
            'role': 'hr_admin',
            'role_label': 'HR / Enterprise Administrator',
            'email': 'hr@novatech.demo',
            'name': 'Sarah Vance (Chief People Officer)',
            'enterprise': 'NovaTech Solutions',
            'description': 'Full organization control: workforce intelligence, project staffing, role creation, approvals, and audit log.',
            'default_password': 'password123'
        },
        {
            'role': 'employee',
            'role_label': 'Senior Backend Engineer',
            'email': 'alex@novatech.demo',
            'name': 'Alex Rivera',
            'enterprise': 'NovaTech Solutions',
            'description': 'Personal workspace: Skill DNA, evidence timeline, Staff AI Platform readiness, career roadmap, and Career Copilot.',
            'default_password': 'password123'
        },
        {
            'role': 'employee',
            'role_label': 'Senior Machine Learning Engineer',
            'email': 'maya@novatech.demo',
            'name': 'Maya Lin',
            'enterprise': 'NovaTech Solutions',
            'description': 'Targeting Lead Applied AI Scientist: 91% match, PyTorch/GenAI evidence, project assignments, and What-If simulation.',
            'default_password': 'password123'
        },
        {
            'role': 'employee',
            'role_label': 'Principal Systems Architect',
            'email': 'marcus@novatech.demo',
            'name': 'Marcus Chen',
            'enterprise': 'NovaTech Solutions',
            'description': 'Distributed systems expert: high-scale projects, architecture review, and mentoring.',
            'default_password': 'password123'
        }
    ]
    return Response({'results': demo_list})
