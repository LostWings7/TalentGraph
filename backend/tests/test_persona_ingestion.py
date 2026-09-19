from django.test import TestCase, Client, override_settings
from apps.employees.models import Employee, EmployeeSkill
from apps.skills.models import Skill
from apps.roles.models import Role, RoleSkill
from apps.projects.models import Project, ProjectContribution
from apps.personas.services.file_parser import FileParserService
from apps.personas.services.demo_loader import DemoPersonaLoader
from apps.personas.services.persona_extractor import GeminiPersonaExtractor
from apps.personas.services.persona_creation import PersonaCreationService

@override_settings(AI_ENABLED=False)
class PersonaIngestionTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        
        # Create a test role to verify match generation
        self.python_skill = Skill.objects.create(name="Python", category="Backend")
        self.pytorch_skill = Skill.objects.create(name="PyTorch", category="AI/ML")
        
        self.target_role = Role.objects.create(
            title="Lead AI Engineer",
            department="AI Research",
            description="Lead machine learning initiatives with PyTorch and distributed Python microservices",
            responsibilities="Design scalable AI systems and mentor ML engineers",
            required_experience_years=5.0
        )
        RoleSkill.objects.create(role=self.target_role, skill=self.python_skill, minimum_proficiency="Advanced", importance=0.9, is_required=True)
        RoleSkill.objects.create(role=self.target_role, skill=self.pytorch_skill, minimum_proficiency="Advanced", importance=0.9, is_required=True)

    def test_file_parser_service_csv(self):
        csv_text = "project_name,role_in_project,technologies,outcomes\nRealtime Mesh,Lead Arch,Python; Kubernetes,Scaled to 50k QPS"
        parsed = FileParserService.parse_csv_content(csv_text)
        self.assertEqual(len(parsed), 1)
        self.assertEqual(parsed[0]['project_name'], "Realtime Mesh")
        self.assertEqual(parsed[0]['role_in_project'], "Lead Arch")

    def test_demo_loader(self):
        demos = DemoPersonaLoader.list_demo_personas()
        self.assertTrue(len(demos) >= 3)
        demo_ids = [d['id'] for d in demos]
        self.assertIn('alex-rivera', demo_ids)
        self.assertIn('maya-lin', demo_ids)
        self.assertIn('marcus-chen', demo_ids)

        # Test loading Alex Rivera files
        alex_data = DemoPersonaLoader.get_demo_files('alex-rivera')
        self.assertIsNotNone(alex_data)
        self.assertIn('resume.txt', alex_data['files'])
        self.assertIn('projects.csv', alex_data['files'])

    def test_deterministic_persona_extraction(self):
        alex_data = DemoPersonaLoader.get_demo_files('alex-rivera')
        parsed = FileParserService.parse_uploaded_files(alex_data['files'])
        
        extraction = GeminiPersonaExtractor.extract_persona(parsed)
        self.assertIn('persona', extraction)
        persona = extraction['persona']
        
        self.assertIn('ALEX RIVERA', persona['name'].upper())
        self.assertEqual(persona['department'], 'AI Research')
        self.assertTrue(len(persona['skills']) > 0)
        self.assertTrue(len(persona['projects']) > 0)
        
        # Verify skills have evidence and confidence
        for skill in persona['skills']:
            self.assertTrue(len(skill['evidence']) > 0)
            self.assertTrue(0.0 <= skill['confidence'] <= 1.0)

    def test_persona_creation_and_match_generation(self):
        sample_payload = {
            'name': 'Devon Vance',
            'email': 'devon.vance@talentgraph.internal',
            'department': 'AI Research',
            'current_role': 'Senior ML Engineer',
            'years_experience': 6.0,
            'education': 'M.S. in CS',
            'bio': 'Senior ML engineer specializing in PyTorch and distributed models.',
            'target_role': 'Lead AI Engineer',
            'skills': [
                {
                    'name': 'Python',
                    'category': 'Backend',
                    'proficiency': 'Expert',
                    'confidence': 0.95,
                    'source': 'explicit',
                    'evidence': '7+ years production backend experience'
                },
                {
                    'name': 'PyTorch',
                    'category': 'AI/ML',
                    'proficiency': 'Advanced',
                    'confidence': 0.92,
                    'source': 'project_inferred',
                    'evidence': 'Engineered distributed training pipelines'
                }
            ],
            'projects': [
                {
                    'project_name': 'Distributed Inference Core',
                    'role_in_project': 'Lead Engineer',
                    'technologies': 'Python, PyTorch, Kubernetes',
                    'outcomes': 'Reduced p99 inference latency by 45%',
                    'evidence': 'Production EKS cluster serving 50M daily calls'
                }
            ]
        }

        result = PersonaCreationService.create_or_update_persona(sample_payload)
        self.assertTrue(result['success'])
        emp_data = result['employee']
        self.assertEqual(emp_data['name'], 'Devon Vance')
        self.assertEqual(emp_data['skills_count'], 2)
        self.assertEqual(emp_data['projects_count'], 1)
        self.assertTrue(result['matches_count'] >= 1)

        # Verify database state
        emp = Employee.objects.get(email='devon.vance@talentgraph.internal')
        self.assertEqual(emp.skills.count(), 2)
        self.assertEqual(emp.contributions.count(), 1)
        self.assertIsNotNone(emp.embedding)

    def test_rest_api_endpoints(self):
        # 1. Test Demos API
        resp = self.client.get('/api/personas/demos/')
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(len(resp.json()['results']) >= 3)

        # 2. Test Get Demo Files API
        resp = self.client.get('/api/personas/demos/alex-rivera/files/')
        self.assertEqual(resp.status_code, 200)
        self.assertIn('files', resp.json())

        # 3. Test Parse Files API
        files_payload = resp.json()['files']
        resp = self.client.post('/api/personas/parse-files/', {'files': files_payload}, content_type='application/json')
        self.assertEqual(resp.status_code, 200)
        parsed_data = resp.json()['parsed_data']
        self.assertTrue(resp.json()['sections_detected']['has_resume'])

        # 4. Test Analyze API
        resp = self.client.post('/api/personas/analyze/', {'parsed_data': parsed_data}, content_type='application/json')
        self.assertEqual(resp.status_code, 200)
        extracted = resp.json()['persona']
        self.assertIn('name', extracted)
        self.assertIn('skills', extracted)

        # 5. Test Create API
        resp = self.client.post('/api/personas/create/', {'persona': extracted}, content_type='application/json')
        self.assertEqual(resp.status_code, 201)
        created_id = resp.json()['employee']['id']

        # 6. Test Stats API
        resp = self.client.get('/api/personas/stats/')
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.json()['total_personas'] >= 1)

        # 7. Test Delete API (custom persona)
        resp = self.client.delete(f'/api/personas/{created_id}/')
        self.assertEqual(resp.status_code, 200)
