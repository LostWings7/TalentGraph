from django.urls import path
from apps.core.auth_views import (
    login_view,
    logout_view,
    me_view,
    change_password_view,
    enterprise_setup_view,
    demo_accounts_view
)
from apps.core.enterprise_views import (
    enterprise_profile_view,
    capability_map_view,
    approvals_list_view,
    resolve_approval_view,
    audit_logs_view
)

urlpatterns = [
    # Auth endpoints
    path('auth/login/', login_view, name='auth-login'),
    path('auth/logout/', logout_view, name='auth-logout'),
    path('auth/me/', me_view, name='auth-me'),
    path('auth/change-password/', change_password_view, name='auth-change-password'),
    path('auth/enterprise-setup/', enterprise_setup_view, name='auth-enterprise-setup'),
    path('auth/demo-accounts/', demo_accounts_view, name='auth-demo-accounts'),

    # Enterprise endpoints
    path('enterprises/profile/', enterprise_profile_view, name='enterprise-profile'),
    path('enterprises/capability-map/', capability_map_view, name='enterprise-capability-map'),

    # Approvals endpoints
    path('approvals/', approvals_list_view, name='approvals-list-create'),
    path('approvals/<int:approval_id>/resolve/', resolve_approval_view, name='approvals-resolve'),

    # Audit log
    path('audit/', audit_logs_view, name='audit-logs'),
]
