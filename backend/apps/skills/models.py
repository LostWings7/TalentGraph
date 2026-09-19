from django.db import models
from apps.core.normalization import normalize_skill_name
from apps.core.models import Enterprise

class Skill(models.Model):
    CATEGORY_CHOICES = [
        ('AI/ML', 'Artificial Intelligence & Machine Learning'),
        ('Backend', 'Backend & Distributed Systems'),
        ('Frontend', 'Frontend & Mobile Engineering'),
        ('Data Engineering', 'Data Engineering & Analytics'),
        ('Cloud & DevOps', 'Cloud, Infrastructure & DevOps'),
        ('Security', 'Cybersecurity & Governance'),
        ('Leadership & Product', 'Leadership, Strategy & Product'),
    ]

    TREND_CHOICES = [
        ('Critical', 'Critical High Growth'),
        ('Growing', 'Growing Demand'),
        ('Stable', 'Stable Core Skill'),
    ]

    enterprise = models.ForeignKey(Enterprise, null=True, blank=True, on_delete=models.CASCADE, related_name='custom_skills', help_text='Null for global common taxonomy skills, set for enterprise-custom skills')
    name = models.CharField(max_length=120, db_index=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='Backend')
    description = models.TextField(blank=True, default='')
    market_trend = models.CharField(max_length=20, choices=TREND_CHOICES, default='Growing')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        unique_together = ('enterprise', 'name')

    def __str__(self):
        if self.enterprise:
            return f"{self.name} ({self.enterprise.name})"
        return self.name

    def save(self, *args, **kwargs):
        # Always normalize the skill name before saving
        self.name = normalize_skill_name(self.name)
        super().save(*args, **kwargs)
