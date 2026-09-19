from rest_framework import serializers
from apps.feedback.models import Feedback

class FeedbackSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.name', read_only=True)
    role_title = serializers.CharField(source='role.title', read_only=True, allow_null=True)

    class Meta:
        model = Feedback
        fields = [
            'id', 'employee', 'employee_name', 'role', 'role_title',
            'recommendation_type', 'accepted', 'reason', 'created_at'
        ]
