import unittest

from backend.engine import allocation_for, build_profile, simulate_withdrawal
from backend.models import ProfileAnswers


def answers(**overrides):
    data = {
        "goal": "retirement",
        "horizon": "gt10",
        "horizon_years": 12,
        "liquidity_need": "none",
        "emergency_fund": "yes",
        "debt_status": "none",
        "income_stability": "stable_regular",
        "loss_reaction": "hold",
        "loss_tolerance_pct": 20,
        "monthly_contribution": 200,
        "contribution_currency": "USD",
        "sectors": ["Tecnología"],
    }
    data.update(overrides)
    return ProfileAnswers(**data)


class EngineTests(unittest.TestCase):
    def test_master_formula_builds_capacity_and_tolerance_separately(self):
        result = build_profile(answers())
        self.assertEqual(result.capacity_score, 100)
        self.assertEqual(result.tolerance_score, 65)
        self.assertEqual(result.capacity, "Agresivo")
        self.assertEqual(result.tolerance, "Moderado")
        self.assertEqual(result.profile, "Moderado")

    def test_no_emergency_fund_caps_profile_and_adds_liquidity(self):
        result = build_profile(answers(emergency_fund="no", loss_reaction="buy_more", loss_tolerance_pct=30))
        self.assertEqual(result.profile, "Conservador")
        self.assertGreaterEqual(result.allocation["liquidity"], 50)
        self.assertEqual(result.allocation["satellite"], 0)

    def test_costly_debt_warns_and_caps_risk(self):
        clean = build_profile(answers())
        costly = build_profile(answers(debt_status="costly"))
        self.assertEqual(clean.profile, "Moderado")
        self.assertEqual(costly.profile, "Moderado")
        self.assertTrue(costly.warnings)

    def test_late_debt_is_binding_and_requires_review(self):
        result = build_profile(answers(debt_status="late", loss_reaction="buy_more", loss_tolerance_pct=30))
        self.assertEqual(result.profile, "Conservador")
        self.assertTrue(result.assessment_quality["requires_review"])
        self.assertLessEqual(result.assessment_quality["confidence"], 90)

    def test_sector_limit(self):
        with self.assertRaises(ValueError):
            answers(sectors=["A", "B", "C", "D"])

    def test_allocation_adds_to_100(self):
        result = build_profile(answers())
        self.assertEqual(sum(allocation_for(result).values()), 100)

    def test_short_horizon_is_exactly_conservative(self):
        result = build_profile(answers(horizon="lt1", horizon_years=0.5))
        self.assertEqual(result.profile, "Conservador")
        self.assertEqual(result.allocation, {"liquidity": 80, "stability": 20, "growth": 0, "satellite": 0})

    def test_experience_changes_explanation_only(self):
        beginner = build_profile(answers(experience="none"))
        advanced = build_profile(answers(experience="high"))
        self.assertEqual(beginner.explanation_level, "simple")
        self.assertEqual(advanced.explanation_level, "advanced")
        self.assertEqual(beginner.profile, advanced.profile)
        self.assertEqual(beginner.capacity_score, advanced.capacity_score)
        self.assertEqual(beginner.tolerance_score, advanced.tolerance_score)

    def test_withdrawal_uses_liquidity_first(self):
        result = simulate_withdrawal(1000, 100, 20)
        self.assertEqual(result.from_liquidity, 100)
        self.assertEqual(result.assets_to_sell, 100)


if __name__ == "__main__":
    unittest.main()
