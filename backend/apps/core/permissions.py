from rest_framework import permissions

class IsHRAdmin(permissions.BasePermission):
    """Allows access only to authenticated HR/Enterprise Administrators."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        profile = getattr(request.user, 'profile', None)
        return bool(profile and profile.is_hr)

class IsEmployee(permissions.BasePermission):
    """Allows access to authenticated employees."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        profile = getattr(request.user, 'profile', None)
        return bool(profile and profile.is_employee)

class IsEnterpriseMember(permissions.BasePermission):
    """Allows access only to users belonging to the target enterprise."""
    def has_object_permission(self, request, view, obj):
        if not (request.user and request.user.is_authenticated):
            return False
        profile = getattr(request.user, 'profile', None)
        if not profile:
            return False
        
        # Check object enterprise
        obj_enterprise = getattr(obj, 'enterprise', None)
        if obj_enterprise:
            return obj_enterprise.id == profile.enterprise_id
        return True

class CanAccessEmployeeObject(permissions.BasePermission):
    """
    Object-level permission:
    - HR Admin can access any employee in their enterprise.
    - Employee can only access their own employee record.
    """
    def has_object_permission(self, request, view, obj):
        if not (request.user and request.user.is_authenticated):
            return False
        profile = getattr(request.user, 'profile', None)
        if not profile:
            return False
        
        # obj is Employee
        if obj.enterprise_id != profile.enterprise_id:
            return False
        
        if profile.is_hr:
            return True
        
        # If employee, must be their own record
        return profile.employee_id == obj.id

class CanAccessProjectObject(permissions.BasePermission):
    """
    Object-level permission for projects:
    - HR Admin has full access within their enterprise.
    - If project sensitivity is 'HR_ONLY', employees cannot view detailed project content.
    - If project sensitivity is 'HR_CONTRIBUTORS', employee must be a contributor.
    - If project sensitivity is 'ENTERPRISE_PUBLIC', all employees in enterprise can view.
    """
    def has_object_permission(self, request, view, obj):
        if not (request.user and request.user.is_authenticated):
            return False
        profile = getattr(request.user, 'profile', None)
        if not profile:
            return False
        
        if obj.enterprise_id != profile.enterprise_id:
            return False
        
        if profile.is_hr:
            return True
        
        # Check sensitivity for employee
        if obj.sensitivity_level == 'HR_ONLY':
            return False
        
        if obj.sensitivity_level == 'HR_CONTRIBUTORS':
            if not profile.employee:
                return False
            return obj.contributors.filter(employee=profile.employee).exists()
        
        # ENTERPRISE_PUBLIC
        return True
