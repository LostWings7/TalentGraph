from rest_framework import serializers
from django.contrib.auth.models import User
from apps.core.models import Enterprise, UserProfile, ApprovalRequest, AuditLog

class EnterpriseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Enterprise
        fields = [
            'id', 'name', 'legal_name', 'slug', 'industry', 'description',
            'mission', 'size', 'departments', 'locations', 'work_modes',
            'website', 'logo_url', 'settings', 'created_at'
        ]

class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    name = serializers.SerializerMethodField()
    enterprise = EnterpriseSerializer(read_only=True)
    employee_id = serializers.IntegerField(source='employee.id', read_only=True, allow_null=True)

    class Meta:
        model = UserProfile
        fields = [
            'id', 'username', 'email', 'name', 'role', 'is_temporary_password',
            'title', 'enterprise', 'employee_id', 'created_at'
        ]

    def get_name(self, obj):
        if obj.user.get_full_name():
            return obj.user.get_full_name()
        if obj.employee:
            return obj.employee.name
        return obj.user.username

class ApprovalRequestSerializer(serializers.ModelSerializer):
    requester_name = serializers.SerializerMethodField()
    reviewer_name = serializers.SerializerMethodField()

    class Meta:
        model = ApprovalRequest
        fields = [
            'id', 'enterprise', 'requester', 'requester_name', 'reviewer',
            'reviewer_name', 'request_type', 'status', 'title', 'description',
            'payload', 'reviewer_notes', 'created_at', 'resolved_at'
        ]

    def get_requester_name(self, obj):
        return obj.requester.get_full_name() or obj.requester.username

    def get_reviewer_name(self, obj):
        if obj.reviewer:
            return obj.reviewer.get_full_name() or obj.reviewer.username
        return None

class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = [
            'id', 'enterprise', 'actor_name', 'action', 'target_model',
            'target_id', 'details', 'timestamp'
        ]
