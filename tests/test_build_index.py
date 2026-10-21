"""Tests for tools/build_index.py. Run from the repo root:

    python3 -m unittest discover -s tests -v
"""

import importlib.util
import tempfile
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SPEC = importlib.util.spec_from_file_location("build_index", REPO / "tools" / "build_index.py")
build_index = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(build_index)

VALID_FIELDS = {
    "id": "example-idea",
    "title": "Example idea",
    "status": "seed",
    "domain": "water",
    **{f"score_{k}": "3" for k in build_index.WEIGHTS},
}


def card_text(fields):
    lines = ["---"] + [f"{k}: {v}" for k, v in fields.items()] + ["---", "", "# Body"]
    return "\n".join(lines) + "\n"


def with_scores(**overrides):
    fields = dict(VALID_FIELDS)
    fields.update({f"score_{k}": str(v) for k, v in overrides.items()})
    return fields


class ValidationTests(unittest.TestCase):
    def setUp(self):
        self.path = Path("example-idea.md")

    def test_valid_card_has_no_errors(self):
        self.assertEqual(build_index.validate(self.path, dict(VALID_FIELDS)), [])

    def test_missing_required_fields_reported(self):
        fields = dict(VALID_FIELDS)
        del fields["domain"]
        errors = build_index.validate(self.path, fields)
        self.assertTrue(any("missing fields" in e and "domain" in e for e in errors))

    def test_id_must_match_filename(self):
        fields = dict(VALID_FIELDS, id="other-id")
        errors = build_index.validate(self.path, fields)
        self.assertTrue(any("must match filename" in e for e in errors))

    def test_invalid_domain_reported(self):
        errors = build_index.validate(self.path, dict(VALID_FIELDS, domain="space"))
        self.assertTrue(any("domain 'space'" in e for e in errors))

    def test_invalid_status_reported(self):
        errors = build_index.validate(self.path, dict(VALID_FIELDS, status="done"))
        self.assertTrue(any("status 'done'" in e for e in errors))

    def test_score_out_of_range_reported(self):
        errors = build_index.validate(self.path, with_scores(water=6))
        self.assertTrue(any("score_water" in e for e in errors))

    def test_missing_score_reported(self):
        fields = dict(VALID_FIELDS)
        del fields["score_air"]
        errors = build_index.validate(self.path, fields)
        self.assertIn("missing score_air", errors)

    def test_non_integer_score_reported(self):
        errors = build_index.validate(self.path, with_scores(land="high"))
        self.assertTrue(any("score_land" in e for e in errors))

    def test_front_matter_parsed(self):
        fields = build_index.parse_front_matter(card_text(VALID_FIELDS))
        self.assertEqual(fields["id"], "example-idea")
        self.assertEqual(fields["score_footprint"], "3")

    def test_missing_front_matter_returns_none(self):
        self.assertIsNone(build_index.parse_front_matter("# No front matter"))


class ScoringTests(unittest.TestCase):
    def test_all_fives_is_100(self):
        scores = {k: 5 for k in build_index.WEIGHTS}
        self.assertEqual(build_index.weighted_score(scores), 100.0)

    def test_all_ones_is_0(self):
        scores = {k: 1 for k in build_index.WEIGHTS}
        self.assertEqual(build_index.weighted_score(scores), 0.0)

    def test_weights_match_rubric(self):
        expected = {
            "footprint": 2.0, "governance": 2.0,
            "community": 1.5, "water": 1.5, "air": 1.5, "land": 1.5,
            "feasibility": 1.0, "data": 1.0,
        }
        self.assertEqual(build_index.WEIGHTS, expected)

    def test_gate_blocks_idea(self):
        scores = {k: 5 for k in build_index.WEIGHTS}
        scores["footprint"] = 1
        self.assertEqual(build_index.blocking_gates(scores), ["footprint"])

    def test_gate_ignores_other_low_scores(self):
        scores = {k: 5 for k in build_index.WEIGHTS}
        scores["water"] = 1
        self.assertEqual(build_index.blocking_gates(scores), [])


class EndToEndTests(unittest.TestCase):
    """Runs main() against a temporary repo layout by swapping the module paths."""

    def run_main(self, cards):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            ideas = root / "ideas"
            ideas.mkdir()
            for name, text in cards.items():
                (ideas / f"{name}.md").write_text(text, encoding="utf-8")
            saved = (build_index.ROOT, build_index.IDEAS_DIR, build_index.INDEX_PATH)
            build_index.ROOT = root
            build_index.IDEAS_DIR = ideas
            build_index.INDEX_PATH = root / "INDEX.md"
            try:
                code = build_index.main()
                index = build_index.INDEX_PATH.read_text(encoding="utf-8") if build_index.INDEX_PATH.exists() else None
            finally:
                build_index.ROOT, build_index.IDEAS_DIR, build_index.INDEX_PATH = saved
            return code, index

    def test_invalid_card_exits_nonzero_and_writes_no_index(self):
        bad = dict(VALID_FIELDS, id="bad-card", domain="space")
        code, index = self.run_main({"bad-card": card_text(bad)})
        self.assertEqual(code, 1)
        self.assertIsNone(index)

    def test_valid_cards_write_index(self):
        good = dict(VALID_FIELDS, id="good-card")
        code, index = self.run_main({"good-card": card_text(good)})
        self.assertEqual(code, 0)
        self.assertIn("1 ranked, 0 blocked", index or "")
        self.assertIn("## Blocked by a hard gate", index or "")


if __name__ == "__main__":
    unittest.main()
