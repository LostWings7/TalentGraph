from rest_framework import serializers
from apps.skills.models import Skill

class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name', 'category', 'description', 'market_trend', 'created_at']
