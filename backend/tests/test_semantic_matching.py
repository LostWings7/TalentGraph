import unittest
from apps.core.math_utils import cosine_similarity
from apps.ai.embeddings import _generate_fallback_embedding, compute_semantic_similarity

class SemanticMatchingTestCase(unittest.TestCase):
    def test_cosine_similarity_properties(self):
        vec1 = [1.0, 0.0, 1.0, 0.0]
        vec2 = [1.0, 0.0, 1.0, 0.0]
        # Identical vectors should yield 1.0
        self.assertAlmostEqual(cosine_similarity(vec1, vec2), 1.0, places=4)

        vec_orth = [0.0, 1.0, 0.0, 1.0]
        # Orthogonal vectors should yield 0.0
        self.assertAlmostEqual(cosine_similarity(vec1, vec_orth), 0.0, places=4)

        # Empty / zero vectors
        self.assertEqual(cosine_similarity([], []), 0.0)
        self.assertEqual(cosine_similarity([0.0, 0.0], [0.0, 0.0]), 0.0)

    def test_text_embedding_fallback_similarity(self):
        text_ai_1 = "Senior Machine Learning Engineer training PyTorch models and neural networks"
        text_ai_2 = "Machine Learning Specialist developing deep learning PyTorch transformer models"
        text_frontend = "Frontend UI Developer building React and Tailwind CSS components"

        emb_ai_1 = _generate_fallback_embedding(text_ai_1)
        emb_ai_2 = _generate_fallback_embedding(text_ai_2)
        emb_fe = _generate_fallback_embedding(text_frontend)

        sim_related = compute_semantic_similarity(emb_ai_1, emb_ai_2)
        sim_unrelated = compute_semantic_similarity(emb_ai_1, emb_fe)

        # Semantically related texts should have significantly higher similarity than unrelated
        self.assertGreater(sim_related, sim_unrelated)
        self.assertGreater(sim_related, 0.10)
        self.assertLess(sim_unrelated, sim_related)
