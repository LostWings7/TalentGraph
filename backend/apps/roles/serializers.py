from rest_framework import serializers
from apps.roles.models import Role, RoleSkill
from apps.skills.serializers import SkillSerializer

class RoleSkillSerializer(serializers.ModelSerializer):
    skill = SkillSerializer(read_only=True)
    skill_name = serializers.CharField(source='skill.name', read_only=True)
    skill_category = serializers.CharField(source='skill.category', read_only=True)

    class Meta:
        model = RoleSkill
        fields = [
            'id', 'role', 'skill', 'skill_name', 'skill_category',
            'importance', 'minimum_proficiency', 'is_required'
        ]

class RoleSerializer(serializers.ModelSerializer):
    required_skills_count = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = [
            'id', 'enterprise', 'title', 'department', 'description', 'responsibilities',
            'required_experience_years', 'future_demand_level', 'is_active',
            'required_skills_count', 'created_at'
        ]

    def get_required_skills_count(self, obj):
        return obj.role_skills.count()

class RoleDetailSerializer(serializers.ModelSerializer):
    role_skills = RoleSkillSerializer(many=True, read_only=True)

    class Meta:
        model = Role
        fields = [
            'id', 'enterprise', 'title', 'department', 'description', 'responsibilities',
            'required_experience_years', 'future_demand_level', 'is_active',
            'role_skills', 'created_at'
        ]
