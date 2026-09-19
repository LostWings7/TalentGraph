"""Gemini 3.7 Flash Persona Extractor with Deterministic Fallbacks.

Extracts structured talent profiles, explicit and inferred skills, grounding evidence,
project deliverables, certifications, and learning records from ingested text & CSVs.
"""
import re
import logging
from typing import Dict, Any, List, Optional
from apps.ai.gemini_client import generate_structured_gemini_response
from apps.core.normalization import normalize_skill_name
from apps.personas.schemas import ExtractedPersonaSchema
from apps.personas.services.file_parser import FileParserService

logger = logging.getLogger(__name__)

SYSTEM_INSTRUCTION = """You are TalentGraph AI's principal talent intelligence architect.
Your mission is to analyze unstructured career artifacts (resumes, project contributions, certifications, learning history)
and synthesize a complete, highly structured, evidence-grounded employee profile.

CRITICAL INSTRUCTIONS:
1. Identify ALL explicit technical skills mentioned in the resume or certifications.
2. Infer hidden/transferable skills from project outcomes and architecture deliverables.
3. Every skill MUST have a concrete 'evidence' string explaining where and how it was applied.
4. Categorize skills accurately: 'AI/ML', 'Backend', 'Frontend', 'Data Engineering', 'Cloud & DevOps', 'Security', 'Leadership & Product'.
5. Assign calibrated confidence scores (0.60 to 0.98) based on evidence depth.
6. Calibrate proficiency: 'Beginner', 'Intermediate', 'Advanced', 'Expert' based on years and impact.
7. Return clean, structured JSON matching the provided schema.
"""

# Skill category taxonomy mapping
KNOWN_SKILLS_TAXONOMY = {
    'PyTorch': ('AI/ML', 'Advanced'),
    'TensorFlow': ('AI/ML', 'Intermediate'),
    'Transformers': ('AI/ML', 'Advanced'),
    'Hugging Face': ('AI/ML', 'Advanced'),
    'Large Language Models': ('AI/ML', 'Advanced'),
    'Ray': ('AI/ML', 'Advanced'),
    'DeepSpeed': ('AI/ML', 'Advanced'),
    'LoRA': ('AI/ML', 'Advanced'),
    'MLOps': ('AI/ML', 'Advanced'),
    'Feast': ('AI/ML', 'Advanced'),
    'ONNX Runtime': ('AI/ML', 'Intermediate'),
    'TensorRT': ('AI/ML', 'Advanced'),
    'LangChain': ('AI/ML', 'Intermediate'),
    'LlamaIndex': ('AI/ML', 'Intermediate'),
    'Computer Vision': ('AI/ML', 'Intermediate'),
    'NLP': ('AI/ML', 'Advanced'),
    'Snowflake': ('Data Engineering', 'Advanced'),
    'dbt': ('Data Engineering', 'Advanced'),
    'Apache Spark': ('Data Engineering', 'Advanced'),
    'PySpark': ('Data Engineering', 'Advanced'),
    'SQL': ('Data Engineering', 'Expert'),
    'PostgreSQL': ('Data Engineering', 'Advanced'),
    'Redis': ('Backend', 'Advanced'),
    'Kafka': ('Data Engineering', 'Advanced'),
    'Airflow': ('Data Engineering', 'Advanced'),
    'Great Expectations': ('Data Engineering', 'Intermediate'),
    'Tableau': ('Data Engineering', 'Advanced'),
    'A/B Testing': ('Data Engineering', 'Advanced'),
    'Causal Inference': ('Data Engineering', 'Advanced'),
    'Statistics': ('Data Engineering', 'Advanced'),
    'Kubernetes': ('Cloud & DevOps', 'Advanced'),
    'Docker': ('Cloud & DevOps', 'Advanced'),
    'Terraform': ('Cloud & DevOps', 'Advanced'),
    'AWS': ('Cloud & DevOps', 'Advanced'),
    'Google Cloud': ('Cloud & DevOps', 'Advanced'),
    'ArgoCD': ('Cloud & DevOps', 'Advanced'),
    'Helm': ('Cloud & DevOps', 'Advanced'),
    'Istio': ('Cloud & DevOps', 'Advanced'),
    'Prometheus': ('Cloud & DevOps', 'Advanced'),
    'Grafana': ('Cloud & DevOps', 'Advanced'),
    'OpenTelemetry': ('Cloud & DevOps', 'Intermediate'),
    'HashiCorp Vault': ('Security', 'Advanced'),
    'SPIRE': ('Security', 'Intermediate'),
    'Zero-Trust': ('Security', 'Advanced'),
    'Chaos Engineering': ('Cloud & DevOps', 'Intermediate'),
    'SRE': ('Cloud & DevOps', 'Advanced'),
    'Python': ('Backend', 'Expert'),
    'Go': ('Backend', 'Advanced'),
    'FastAPI': ('Backend', 'Advanced'),
    'Django': ('Backend', 'Advanced'),
    'Microservices': ('Backend', 'Advanced'),
    'Distributed Systems': ('Backend', 'Advanced'),
    'gRPC': ('Backend', 'Intermediate'),
    'System Architecture': ('Leadership & Product', 'Advanced'),
    'Technical Mentorship': ('Leadership & Product', 'Advanced'),
}

class GeminiPersonaExtractor:
    @staticmethod
    def extract_persona(
        parsed_data: Dict[str, Any], 
        initial_identity: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Runs Gemini 3.7 Flash structured extraction with automatic deterministic fallback."""
        prompt_context = FileParserService.build_extraction_prompt_context(parsed_data, initial_identity)
        
        prompt = f"""Synthesize a complete employee talent profile from the following ingested career data:

{prompt_context}

Please extract all employee identity details, comprehensive skills with evidence and confidence scores,
project deliverables, certifications, and learning records according to the structured schema.
"""
        # 1. Attempt Gemini 3.7 Flash structured extraction
        extracted_model: Optional[ExtractedPersonaSchema] = generate_structured_gemini_response(
            prompt=prompt,
            response_schema=ExtractedPersonaSchema,
            system_instruction=SYSTEM_INSTRUCTION,
            temperature=0.2
        )

        if extracted_model:
            logger.info("Successfully extracted persona using Gemini 3.7 Flash structured output.")
            result_dict = extracted_model.model_dump()
            return {
                'persona': result_dict,
                'engine': 'Gemini 3.7 Flash',
                'is_ai_generated': True,
                'confidence_calibration': 'AI Grounded'
            }

        # 2. Fallback to deterministic extraction engine
        logger.info("Using deterministic fallback persona extraction engine.")
        fallback_data = GeminiPersonaExtractor._deterministic_fallback_extract(parsed_data, initial_identity)
        return {
            'persona': fallback_data,
            'engine': 'Deterministic Talent Engine (Offline / Fallback)',
            'is_ai_generated': False,
            'confidence_calibration': 'Deterministic Grounded'
        }

    @staticmethod
    def _deterministic_fallback_extract(
        parsed_data: Dict[str, Any], 
        initial_identity: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Deterministic extraction pipeline when AI services are unavailable."""
        resume_text = parsed_data.get('resume_text', '')
        projects_raw = parsed_data.get('projects', [])
        certs_raw = parsed_data.get('certifications', [])
        learning_raw = parsed_data.get('learning_history', [])
        work_raw = parsed_data.get('work_history', [])

        init_id = initial_identity or {}

        # 1. Determine Identity
        name = init_id.get('name')
        if not name:
            first_line = resume_text.strip().split('\n')[0] if resume_text else 'New Talent Persona'
            name = re.sub(r'[^a-zA-Z\s]', '', first_line).strip() or 'New Talent Persona'

        email = init_id.get('email')
        if not email:
            email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', resume_text)
            email = email_match.group(0) if email_match else f"{name.lower().replace(' ', '.')}@talentgraph.internal"

        current_role = init_id.get('current_role')
        if not current_role:
            role_match = re.search(r'(Senior|Lead|Staff|Principal|Core)?\s*(Machine Learning|Data|Software|Cloud|DevOps|Platform|Security|Backend|Frontend)\s*(Engineer|Architect|Specialist|Scientist|Developer)', resume_text, re.I)
            current_role = role_match.group(0) if role_match else 'Software Engineer'

        department = init_id.get('department')
        if not department:
            if any(k in current_role.lower() for k in ['ml', 'machine learning', 'ai']):
                department = 'AI Research'
            elif any(k in current_role.lower() for k in ['data', 'analytics']):
                department = 'Data Platform'
            elif any(k in current_role.lower() for k in ['cloud', 'devops', 'sre', 'reliability', 'infrastructure']):
                department = 'Cloud Architecture'
            elif any(k in current_role.lower() for k in ['security', 'governance']):
                department = 'Security'
            else:
                department = 'Engineering'

        years_exp = float(init_id.get('years_experience') or 5.0)
        exp_match = re.search(r'(\d+(\.\d+)?)\+?\s*years', resume_text, re.I)
        if exp_match:
            try:
                years_exp = float(exp_match.group(1))
            except ValueError:
                pass

        # 2. Extract Skills
        discovered_skills = {}

        # Scan text against taxonomy
        combined_text = f"{resume_text} " + " ".join([str(p) for p in projects_raw]) + " " + " ".join([str(c) for c in certs_raw])
        for skill_name, (cat, default_prof) in KNOWN_SKILLS_TAXONOMY.items():
            if re.search(r'\b' + re.escape(skill_name) + r'\b', combined_text, re.I):
                # Look for evidence in projects
                evidence = f"Applied {skill_name} across core technical deliverables and architectural workflows."
                for p in projects_raw:
                    if skill_name.lower() in str(p.get('technologies', '')).lower() or skill_name.lower() in str(p.get('outcomes', '')).lower():
                        evidence = f"Demonstrated in {p.get('project_name', 'project')}: {p.get('outcomes', '') or p.get('evidence', '')}"
                        break

                discovered_skills[skill_name] = {
                    'name': normalize_skill_name(skill_name),
                    'category': cat,
                    'proficiency': default_prof,
                    'confidence': 0.88,
                    'source': 'explicit' if skill_name.lower() in resume_text.lower() else 'project_inferred',
                    'evidence': evidence,
                    'freshness_year': 2024
                }

        # Skills from certifications
        for c in certs_raw:
            c_name = c.get('certification_name', '')
            v_skills = c.get('skills_verified', '')
            if v_skills:
                for s_part in v_skills.split(','):
                    s_clean = s_part.strip()
                    if s_clean and s_clean not in discovered_skills:
                        discovered_skills[s_clean] = {
                            'name': normalize_skill_name(s_clean),
                            'category': 'Cloud & DevOps' if 'AWS' in c_name or 'Kubernetes' in c_name else 'AI/ML',
                            'proficiency': 'Advanced',
                            'confidence': 0.95,
                            'source': 'learning',
                            'evidence': f"Formally verified via credential: {c_name} ({c.get('issuing_organization', '')})",
                            'freshness_year': 2023
                        }

        # 3. Format Projects
        projects_list = []
        for p in projects_raw:
            projects_list.append({
                'project_name': p.get('project_name', 'Internal High-Impact Initiative'),
                'role_in_project': p.get('role_in_project', 'Core Contributor'),
                'technologies': p.get('technologies', 'Python, Cloud Infrastructure'),
                'outcomes': p.get('outcomes', 'Delivered mission-critical scalability improvements.'),
                'evidence': p.get('evidence', p.get('outcomes', '')),
                'duration_months': int(p.get('duration_months', 6)) if str(p.get('duration_months', '')).isdigit() else 6
            })

        # 4. Format Certifications
        certs_list = []
        for c in certs_raw:
            certs_list.append({
                'certification_name': c.get('certification_name', ''),
                'issuing_organization': c.get('issuing_organization', 'Industry Accredited'),
                'issue_date': c.get('issue_date', '2023-01-01'),
                'skills_verified': c.get('skills_verified', '')
            })

        # 5. Format Learning
        learning_list = []
        for l in learning_raw:
            learning_list.append({
                'title': l.get('course_title', l.get('title', '')),
                'provider': l.get('provider', 'Internal Academy'),
                'difficulty': l.get('difficulty', 'Intermediate'),
                'status': l.get('status', 'Completed'),
                'skills_acquired': l.get('skills_acquired', ''),
                'outcome': l.get('outcome', 'Completed capstone and passed technical examination.')
            })

        # 6. Format Work History
        work_list = []
        for w in work_raw:
            work_list.append({
                'company': w.get('company', 'Enterprise Systems'),
                'role': w.get('role', current_role),
                'department': w.get('department', department),
                'highlights': w.get('highlights', '')
            })

        bio = init_id.get('bio') or f"{name} is a {current_role} with {years_exp} years of industry experience specializing in {department.lower()} architectures, high-impact deliverables, and distributed systems."

        return {
            'name': name,
            'email': email,
            'department': department,
            'current_role': current_role,
            'years_experience': years_exp,
            'education': init_id.get('education') or 'B.S. in Computer Science / Engineering',
            'certifications_summary': ", ".join([c.get('certification_name', '') for c in certs_list if c.get('certification_name')]),
            'bio': bio,
            'interests': init_id.get('interests') or 'Emerging AI architectures, distributed platforms, leadership and technical mastery',
            'target_role': init_id.get('target_role') or f"Principal {current_role.replace('Senior ', '').replace('Lead ', '').replace('Staff ', '')}",
            'skills': list(discovered_skills.values()),
            'projects': projects_list,
            'certifications': certs_list,
            'learning': learning_list,
            'work_history': work_list,
            'strengths': [
                f"Deep domain mastery in {department}",
                "Proven track record of high-throughput production deliverables",
                "Cross-functional architectural design and execution"
            ],
            'growth_areas': [
                "Strategic multi-team technical alignment",
                "Advanced executive stakeholder communications"
            ]
        }
