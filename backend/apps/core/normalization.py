"""Skill Normalization and Canonicalization Service.

Provides deterministic mapping and normalization for skill strings before
scoring, matching, or gap calculation.
"""
import re

SKILL_ALIASES = {
    # Frontend
    'react': 'React',
    'react.js': 'React',
    'reactjs': 'React',
    'react native': 'React Native',
    'reactnative': 'React Native',
    'vue': 'Vue.js',
    'vue.js': 'Vue.js',
    'vuejs': 'Vue.js',
    'angular': 'Angular',
    'angularjs': 'Angular',
    'typescript': 'TypeScript',
    'ts': 'TypeScript',
    'javascript': 'JavaScript',
    'js': 'JavaScript',
    'html': 'HTML5',
    'html5': 'HTML5',
    'css': 'CSS3',
    'css3': 'CSS3',
    'tailwind': 'Tailwind CSS',
    'tailwindcss': 'Tailwind CSS',
    'next': 'Next.js',
    'next.js': 'Next.js',
    'nextjs': 'Next.js',

    # Backend
    'python': 'Python',
    'python3': 'Python',
    'py': 'Python',
    'django': 'Django',
    'drf': 'Django REST Framework',
    'django rest framework': 'Django REST Framework',
    'fastapi': 'FastAPI',
    'flask': 'Flask',
    'node': 'Node.js',
    'node.js': 'Node.js',
    'nodejs': 'Node.js',
    'express': 'Express.js',
    'express.js': 'Express.js',
    'java': 'Java',
    'spring': 'Spring Boot',
    'spring boot': 'Spring Boot',
    'springboot': 'Spring Boot',
    'golang': 'Go',
    'go': 'Go',
    'c#': 'C#',
    'dotnet': '.NET Core',
    '.net': '.NET Core',
    '.net core': '.NET Core',
    'rust': 'Rust',

    # Data & Databases
    'postgres': 'PostgreSQL',
    'postgresql': 'PostgreSQL',
    'mysql': 'MySQL',
    'sql': 'SQL',
    'redis': 'Redis',
    'mongodb': 'MongoDB',
    'mongo': 'MongoDB',
    'elasticsearch': 'Elasticsearch',
    'kafka': 'Apache Kafka',
    'apache kafka': 'Apache Kafka',
    'spark': 'Apache Spark',
    'apache spark': 'Apache Spark',
    'pyspark': 'Apache Spark',
    'airflow': 'Apache Airflow',
    'apache airflow': 'Apache Airflow',
    'dbt': 'dbt',
    'snowflake': 'Snowflake',
    'data modeling': 'Data Modeling',
    'data warehousing': 'Data Warehousing',
    'etl': 'ETL Pipelines',
    'etl pipelines': 'ETL Pipelines',

    # AI & Machine Learning
    'ml': 'Machine Learning',
    'machine learning': 'Machine Learning',
    'ai': 'Artificial Intelligence',
    'artificial intelligence': 'Artificial Intelligence',
    'ai/ml': 'Machine Learning',
    'ai / ml': 'Machine Learning',
    'deep learning': 'Deep Learning',
    'dl': 'Deep Learning',
    'nlp': 'Natural Language Processing',
    'natural language processing': 'Natural Language Processing',
    'computer vision': 'Computer Vision',
    'cv': 'Computer Vision',
    'genai': 'Generative AI',
    'gen ai': 'Generative AI',
    'generative ai': 'Generative AI',
    'llm': 'Large Language Models',
    'llms': 'Large Language Models',
    'large language models': 'Large Language Models',
    'rag': 'Retrieval-Augmented Generation (RAG)',
    'retrieval-augmented generation': 'Retrieval-Augmented Generation (RAG)',
    'pytorch': 'PyTorch',
    'torch': 'PyTorch',
    'tensorflow': 'TensorFlow',
    'tf': 'TensorFlow',
    'scikit-learn': 'Scikit-Learn',
    'sklearn': 'Scikit-Learn',
    'mlops': 'MLOps',
    'model deployment': 'Model Deployment',
    'time series': 'Time Series Analysis',
    'time series analysis': 'Time Series Analysis',
    'reinforcement learning': 'Reinforcement Learning',
    'rl': 'Reinforcement Learning',

    # Cloud & DevOps
    'aws': 'Amazon Web Services (AWS)',
    'amazon web services': 'Amazon Web Services (AWS)',
    'gcp': 'Google Cloud Platform (GCP)',
    'google cloud': 'Google Cloud Platform (GCP)',
    'google cloud platform': 'Google Cloud Platform (GCP)',
    'azure': 'Microsoft Azure',
    'docker': 'Docker',
    'containerization': 'Docker',
    'kubernetes': 'Kubernetes',
    'k8s': 'Kubernetes',
    'terraform': 'Terraform',
    'iac': 'Infrastructure as Code (IaC)',
    'infrastructure as code': 'Infrastructure as Code (IaC)',
    'ci/cd': 'CI/CD Pipelines',
    'cicd': 'CI/CD Pipelines',
    'ci cd': 'CI/CD Pipelines',
    'github actions': 'GitHub Actions',
    'jenkins': 'Jenkins',
    'linux': 'Linux',

    # Security
    'cybersecurity': 'Cybersecurity',
    'security': 'Cybersecurity',
    'appsec': 'Application Security',
    'application security': 'Application Security',
    'cloud security': 'Cloud Security',
    'devsecops': 'DevSecOps',
    'soc2': 'SOC 2 Compliance',
    'zero trust': 'Zero Trust Architecture',

    # Leadership, Product & Soft Skills
    'system design': 'System Design',
    'software architecture': 'Software Architecture',
    'architecture': 'Software Architecture',
    'technical leadership': 'Technical Leadership',
    'tech lead': 'Technical Leadership',
    'agile': 'Agile / Scrum',
    'scrum': 'Agile / Scrum',
    'product management': 'Product Management',
    'cross-functional collaboration': 'Cross-Functional Collaboration',
    'mentoring': 'Mentoring & Coaching',
    'code review': 'Code Review & Quality',
}

def normalize_skill_name(raw_name: str) -> str:
    """Normalize a skill name string into its canonical representation."""
    if not raw_name or not isinstance(raw_name, str):
        return ""
    
    cleaned = raw_name.strip()
    # Remove surrounding quotes or punctuation
    cleaned = re.sub(r'^[\s"\'`\-•*]+|[\s"\'`\-•*]+$', '', cleaned)
    
    lookup_key = cleaned.lower()
    
    # Direct alias match
    if lookup_key in SKILL_ALIASES:
        return SKILL_ALIASES[lookup_key]
    
    # Try normalized spacing
    lookup_key_condensed = re.sub(r'[\s_\-]+', ' ', lookup_key).strip()
    if lookup_key_condensed in SKILL_ALIASES:
        return SKILL_ALIASES[lookup_key_condensed]
        
    # Return title-cased or preserved cleaned string
    return cleaned
