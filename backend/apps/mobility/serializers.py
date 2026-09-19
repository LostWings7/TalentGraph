from rest_framework import serializers
from apps.mobility.models import RoleMatch

class RoleMatchSerializer(serializers.ModelSerializer):
    role_title = serializers.CharField(source='role.title', read_only=True)
    role_department = serializers.CharField(source='role.department', read_only=True)
    future_demand_level = serializers.CharField(source='role.future_demand_level', read_only=True)
    required_experience_years = serializers.FloatField(source='role.required_experience_years', read_only=True)

    class Meta:
        model = RoleMatch
        fields = [
            'id', 'employee', 'role', 'role_title', 'role_department',
            'future_demand_level', 'required_experience_years',
            'overall_score', 'semantic_score', 'skill_score',
            'experience_score', 'project_score', 'matched_skills',
            'missing_skills', 'partially_matched_skills', 'explanation', 'created_at'
        ]
