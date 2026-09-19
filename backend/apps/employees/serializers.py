from rest_framework import serializers
from apps.employees.models import Employee, EmployeeSkill, CareerGoal
from apps.skills.models import Skill
from apps.skills.serializers import SkillSerializer

class EmployeeSkillSerializer(serializers.ModelSerializer):
    skill_name = serializers.CharField(source='skill.name', read_only=True)
    skill_category = serializers.CharField(source='skill.category', read_only=True)
    verified_by_name = serializers.SerializerMethodField()

    class Meta:
        model = EmployeeSkill
        fields = [
            'id', 'employee', 'skill', 'skill_name', 'skill_category',
            'proficiency', 'confidence', 'source', 'evidence',
            'verification_status', 'verified_at', 'verified_by', 'verified_by_name',
            'last_demonstrated_date', 'created_at'
        ]

    def get_verified_by_name(self, obj):
        if obj.verified_by:
            return obj.verified_by.get_full_name() or obj.verified_by.username
        return None

class CareerGoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = CareerGoal
        fields = ['id', 'employee', 'target_role_title', 'target_role_id', 'notes', 'updated_at']

class EmployeeSerializer(serializers.ModelSerializer):
    skill_count = serializers.IntegerField(source='skills.count', read_only=True)
    availability_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = [
            'id', 'enterprise', 'name', 'email', 'department', 'current_role',
            'years_experience', 'education', 'certifications', 'bio',
            'interests', 'avatar_url', 'availability_pct', 'availability_percentage',
            'current_allocation_pct', 'skill_count', 'created_at'
        ]

    def get_availability_percentage(self, obj):
        return int(obj.availability_pct * 100)

class EmployeeDetailSerializer(serializers.ModelSerializer):
    skills = EmployeeSkillSerializer(many=True, read_only=True)
    career_goal = CareerGoalSerializer(read_only=True)
    availability_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = [
            'id', 'enterprise', 'name', 'email', 'department', 'current_role',
            'years_experience', 'education', 'certifications', 'bio',
            'interests', 'avatar_url', 'availability_pct', 'availability_percentage',
            'current_allocation_pct', 'skills', 'career_goal', 'created_at'
        ]

    def get_availability_percentage(self, obj):
        return int(obj.availability_pct * 100)
