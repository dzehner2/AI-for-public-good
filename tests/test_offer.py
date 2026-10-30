"""Tests for tools/offer.py. Run from the repo root:

    python3 -m unittest discover -s tests -v
"""

import argparse
import importlib.util
import json
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SPEC = importlib.util.spec_from_file_location("offer", REPO / "tools" / "offer.py")
offer = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(offer)

NOW = datetime(2026, 10, 30, 12, 0, tzinfo=timezone.utc)


def args(**overrides):
    base = dict(type="expertise", project="water-quality-sensing", name="Ana",
                details="Can calibrate turbidity sensors", available="evenings",
                share_contact=False, contact="")
    base.update(overrides)
    return argparse.Namespace(**base)


class ValidationTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.ideas = Path(self.tmp.name)
        (self.ideas / "water-quality-sensing.md").write_text("card", encoding="utf-8")

    def tearDown(self):
        self.tmp.cleanup()

    def build(self, **overrides):
        return offer.build_offer(args(**overrides), ideas_dir=self.ideas, now=NOW)

    def test_valid_offer_builds(self):
        result = self.build()
        self.assertEqual(result["type"], "expertise")
        self.assertEqual(result["name"], "Ana")
        self.assertIsNone(result["contact"])

    def test_unknown_type_rejected(self):
        with self.assertRaisesRegex(ValueError, "type must be"):
            self.build(type="favor")

    def test_unknown_project_rejected(self):
        with self.assertRaisesRegex(ValueError, "no idea card"):
            self.build(project="made-up")

    def test_general_project_allowed(self):
        self.assertEqual(self.build(project="general")["project"], "general")

    def test_blank_name_becomes_anonymous(self):
        self.assertEqual(self.build(name="  ")["name"], "Anonymous")

    def test_empty_details_rejected(self):
        with self.assertRaisesRegex(ValueError, "details are required"):
            self.build(details="   ")

    def test_long_details_rejected(self):
        with self.assertRaisesRegex(ValueError, "details must be"):
            self.build(details="x" * (offer.MAX_DETAILS + 1))

    def test_contact_dropped_without_consent(self):
        result = self.build(contact="ana@example.org", share_contact=False)
        self.assertIsNone(result["contact"])

    def test_contact_kept_with_consent(self):
        result = self.build(contact="ana@example.org", share_contact=True)
        self.assertEqual(result["contact"], "ana@example.org")

    def test_consent_without_contact_rejected(self):
        with self.assertRaisesRegex(ValueError, "needs --contact"):
            self.build(share_contact=True, contact="")


class StorageTests(unittest.TestCase):
    def test_save_and_summarize(self):
        with tempfile.TemporaryDirectory() as tmp:
            offers_dir = Path(tmp) / "offers"
            first = {"type": "time", "project": "general", "name": "A", "details": "d",
                     "available": "", "contact": None, "submitted": NOW.isoformat()}
            second = dict(first, type="expertise", project="water-quality-sensing")
            path = offer.save_offer(first, offers_dir)
            offer.save_offer(second, offers_dir)
            self.assertTrue(path.exists())
            json.loads(path.read_text(encoding="utf-8"))  # valid JSON
            counts = offer.summarize(offers_dir)
        self.assertEqual(counts, {"general": {"time": 1}, "water-quality-sensing": {"expertise": 1}})

    def test_summary_never_includes_contact(self):
        with tempfile.TemporaryDirectory() as tmp:
            offers_dir = Path(tmp) / "offers"
            with_contact = {"type": "money", "project": "general", "name": "B", "details": "d",
                            "available": "", "contact": "secret@example.org", "submitted": NOW.isoformat()}
            offer.save_offer(with_contact, offers_dir)
            counts = offer.summarize(offers_dir)
        self.assertNotIn("secret@example.org", json.dumps(counts))

    def test_summary_empty_when_no_directory(self):
        with tempfile.TemporaryDirectory() as tmp:
            self.assertEqual(offer.summarize(Path(tmp) / "missing"), {})


if __name__ == "__main__":
    unittest.main()
