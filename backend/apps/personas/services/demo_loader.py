"""Demo Persona Loader Service.

Discovers and loads demo personas from demo-data/personas/ on disk.
"""
import os
import glob
from pathlib import Path
from typing import List, Dict, Any, Optional
from django.conf import settings

DEMO_DATA_DIR = Path(settings.BASE_DIR).parent / 'demo-data' / 'personas'

DEMO_METADATA = {
    'alex-rivera': {
        'id': 'alex-rivera',
        'name': 'Alex Rivera',
        'current_role': 'Senior Machine Learning Engineer',
        'department': 'AI Research',
        'years_experience': 6.5,
        'tagline': 'Large-Scale Distributed ML & Inference Optimization Specialist',
        'avatar_url': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        'badge': 'AI / ML Track',
        'files_included': ['resume.txt', 'projects.csv', 'certifications.csv', 'learning_history.csv', 'work_history.csv']
    },
    'maya-lin': {
        'id': 'maya-lin',
        'name': 'Maya Lin',
        'current_role': 'Lead Data Scientist & Analytics Architect',
        'department': 'Data Platform',
        'years_experience': 7.0,
        'tagline': 'Modern Lakehouse, Experimentation Platforms & Causal Analytics Lead',
        'avatar_url': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        'badge': 'Data Science Track',
        'files_included': ['resume.txt', 'projects.csv', 'certifications.csv', 'learning_history.csv', 'work_history.csv']
    },
    'marcus-chen': {
        'id': 'marcus-chen',
        'name': 'Marcus Chen',
        'current_role': 'Staff Cloud Platform & Reliability Engineer',
        'department': 'Cloud Architecture',
        'years_experience': 8.0,
        'tagline': 'Multi-Cloud Kubernetes, Zero-Trust Mesh & GitOps Reliability Architect',
        'avatar_url': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        'badge': 'Cloud & DevOps Track',
        'files_included': ['resume.txt', 'projects.csv', 'certifications.csv', 'learning_history.csv', 'work_history.csv']
    }
}

class DemoPersonaLoader:
    @staticmethod
    def list_demo_personas() -> List[Dict[str, Any]]:
        """Returns a list of all available demo persona configurations."""
        results = []
        for demo_id, meta in DEMO_METADATA.items():
            demo_path = DEMO_DATA_DIR / demo_id
            is_available = demo_path.exists()
            results.append({
                **meta,
                'is_available': is_available,
                'directory': str(demo_path) if is_available else None
            })
        return results

    @staticmethod
    def get_demo_files(demo_id: str) -> Optional[Dict[str, Any]]:
        """Loads all raw file contents for a specific demo persona ID."""
        demo_path = DEMO_DATA_DIR / demo_id
        if not demo_path.exists():
            return None

        files_content = {}
        for file_path in demo_path.glob('*.*'):
            fname = file_path.name
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    files_content[fname] = f.read()
            except Exception:
                continue

        return {
            'demo_id': demo_id,
            'metadata': DEMO_METADATA.get(demo_id, {}),
            'files': files_content
        }
