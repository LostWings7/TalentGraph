import unittest
from apps.core.normalization import normalize_skill_name, SKILL_ALIASES

class SkillNormalizationTestCase(unittest.TestCase):
    def test_direct_alias_normalization(self):
        self.assertEqual(normalize_skill_name("reactjs"), "React")
        self.assertEqual(normalize_skill_name("React.js"), "React")
        self.assertEqual(normalize_skill_name("python3"), "Python")
        self.assertEqual(normalize_skill_name("postgres"), "PostgreSQL")
        self.assertEqual(normalize_skill_name("k8s"), "Kubernetes")
        self.assertEqual(normalize_skill_name("ml"), "Machine Learning")
        self.assertEqual(normalize_skill_name("gen ai"), "Generative AI")
        self.assertEqual(normalize_skill_name("rag"), "Retrieval-Augmented Generation (RAG)")
        self.assertEqual(normalize_skill_name("aws"), "Amazon Web Services (AWS)")

    def test_case_insensitivity_and_punctuation(self):
        self.assertEqual(normalize_skill_name("  DOCKER  "), "Docker")
        self.assertEqual(normalize_skill_name("- typescript -"), "TypeScript")
        self.assertEqual(normalize_skill_name('"fastapi"'), "FastAPI")

    def test_unaliased_passthrough(self):
        self.assertEqual(normalize_skill_name("Quantum Computing"), "Quantum Computing")
        self.assertEqual(normalize_skill_name(""), "")
        self.assertEqual(normalize_skill_name(None), "")
