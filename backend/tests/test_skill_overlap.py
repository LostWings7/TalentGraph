import unittest
from apps.core.math_utils import get_proficiency_weight, calculate_experience_score

class SkillOverlapTestCase(unittest.TestCase):
    def test_proficiency_weights(self):
        self.assertEqual(get_proficiency_weight("beginner"), 0.40)
        self.assertEqual(get_proficiency_weight("intermediate"), 0.70)
        self.assertEqual(get_proficiency_weight("advanced"), 0.90)
        self.assertEqual(get_proficiency_weight("expert"), 1.00)
        self.assertEqual(get_proficiency_weight("unknown"), 0.50)

    def test_experience_alignment_curve(self):
        # Candidate meets or exceeds required years
        score_exact = calculate_experience_score(candidate_years=5.0, required_years=5.0)
        self.assertGreaterEqual(score_exact, 0.90)

        score_senior = calculate_experience_score(candidate_years=8.0, required_years=5.0)
        self.assertGreaterEqual(score_senior, 0.95)

        # Candidate slightly under required years
        score_under_1 = calculate_experience_score(candidate_years=4.0, required_years=5.0)
        self.assertGreaterEqual(score_under_1, 0.70)
        self.assertLess(score_under_1, 0.90)

        # Candidate significantly junior
        score_junior = calculate_experience_score(candidate_years=1.0, required_years=5.0)
        self.assertLess(score_junior, 0.50)
        self.assertGreaterEqual(score_junior, 0.10)
