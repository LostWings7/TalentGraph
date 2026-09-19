from rest_framework import serializers
from apps.projects.models import Project, ProjectContribution, StaffingRequest, StaffingRecommendation

class ProjectContributionSerializer(serializers.ModelSerializer):
    employee_id = serializers.IntegerField(source='employee.id', read_only=True)
    employee_name = serializers.CharField(source='employee.name', read_only=True)
    project_id = serializers.IntegerField(source='project.id', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)

    class Meta:
        model = ProjectContribution
        fields = [
            'id', 'employee_id', 'employee_name', 'project_id', 'project_name',
            'role_in_project', 'contribution_summary', 'evidence', 'allocation_pct',
            'technologies_demonstrated', 'verification_status', 'created_at'
        ]

class ProjectSerializer(serializers.ModelSerializer):
    contributors_count = serializers.SerializerMethodField()
    tech_list = serializers.SerializerMethodField()
    required_skills_list = serializers.SerializerMethodField()
    is_contributor = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'enterprise', 'name', 'objective', 'description', 'department',
            'technologies', 'required_skills', 'outcomes', 'duration_months', 'status',
            'start_date', 'end_date', 'sensitivity_level', 'ai_processing_mode',
            'created_by', 'created_at', 'contributors_count', 'tech_list',
            'required_skills_list', 'is_contributor'
        ]

    def get_contributors_count(self, obj):
        return obj.contributors.count()

    def get_tech_list(self, obj):
        return obj.get_tech_list()

    def get_required_skills_list(self, obj):
        return obj.get_required_skills_list()

    def get_is_contributor(self, obj):
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return False
        profile = getattr(request.user, 'profile', None)
        if not profile or not profile.employee:
            return False
        return obj.contributors.filter(employee=profile.employee).exists()

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            profile = getattr(request.user, 'profile', None)
            if profile and profile.is_employee:
                is_contrib = data.get('is_contributor', False)
                # If HR_ONLY and employee is not admin, mask description
                if instance.sensitivity_level == 'HR_ONLY':
                    data['description'] = '[Confidential Internal Enterprise Project - Details Restricted]'
                    data['objective'] = '[Restricted Objective]'
                    data['outcomes'] = '[Restricted Outcomes]'
        return data

class StaffingRecommendationSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.name', read_only=True)
    current_role = serializers.CharField(source='employee.current_role', read_only=True)
    department = serializers.CharField(source='employee.department', read_only=True)
    availability_pct = serializers.SerializerMethodField()

    class Meta:
        model = StaffingRecommendation
        fields = [
            'id', 'staffing_request', 'employee', 'employee_name', 'current_role',
            'department', 'availability_pct', 'overall_score', 'skill_score',
            'experience_score', 'project_score', 'evidence_score', 'freshness_score',
            'availability_score', 'matched_skills', 'missing_skills', 'explanation',
            'rank', 'status', 'feedback_reason', 'created_at'
        ]

    def get_availability_pct(self, obj):
        return int(obj.employee.availability_pct * 100)

class StaffingRequestSerializer(serializers.ModelSerializer):
    recommendations_count = serializers.SerializerMethodField()
    project_name = serializers.CharField(source='project.name', read_only=True, allow_null=True)

    class Meta:
        model = StaffingRequest
        fields = [
            'id', 'enterprise', 'project', 'project_name', 'project_title', 'department',
            'requested_by', 'team_size', 'required_skills', 'minimum_experience',
            'duration_months', 'description', 'status', 'weights_config',
            'recommendations_count', 'created_at'
        ]

    def get_recommendations_count(self, obj):
        return obj.recommendations.count()
