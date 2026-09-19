from rest_framework import serializers
from apps.learning.models import LearningResource, EmployeeLearning
from apps.skills.serializers import SkillSerializer

class LearningResourceSerializer(serializers.ModelSerializer):
    skills_covered = SkillSerializer(many=True, read_only=True)

    class Meta:
        model = LearningResource
        fields = [
            'id', 'title', 'provider', 'description', 'skills_covered',
            'difficulty', 'duration_hours', 'certification_name', 'url', 'created_at'
        ]

class EmployeeLearningSerializer(serializers.ModelSerializer):
    resource_title = serializers.CharField(source='resource.title', read_only=True)
    provider = serializers.CharField(source='resource.provider', read_only=True)
    difficulty = serializers.CharField(source='resource.difficulty', read_only=True)
    duration_hours = serializers.IntegerField(source='resource.duration_hours', read_only=True)
    certification_name = serializers.CharField(source='resource.certification_name', read_only=True)

    class Meta:
        model = EmployeeLearning
        fields = [
            'id', 'employee', 'resource', 'resource_title', 'provider',
            'difficulty', 'duration_hours', 'certification_name',
            'status', 'completion_date', 'outcome', 'created_at'
        ]
