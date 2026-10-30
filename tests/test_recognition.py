"""Tests for tools/recognition.py and offer status changes. Run from the repo root:

    python3 -m unittest discover -s tests -v
"""

import importlib.util
import json
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SPEC = importlib.util.spec_from_file_location("recognition", REPO / "tools" / "recognition.py")
recognition = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(recognition)
offer_tool = recognition.offer_tool

NOW = datetime(2026, 10, 30, 12, 0, tzinfo=timezone.utc)


def offer(name, project="water-quality-sensing", status="offered", days_ago=0):
    submitted = NOW - timedelta(days=days_ago)
    return {"name": name, "project": project, "type": "expertise", "status": status,
            "submitted": submitted.isoformat(timespec="seconds")}


class PointsTests(unittest.TestCase):
    def test_offer_earns_one_point(self):
        self.assertEqual(recognition.points_by_person([offer("Ana")]), {"Ana": 1})

    def test_stages_are_not_added_together_per_project(self):
        offers = [offer("Ana", status="offered"), offer("Ana", status="completed")]
        self.assertEqual(recognition.points_by_person(offers), {"Ana": 10})

    def test_many_offers_to_one_project_earn_no_extra(self):
        offers = [offer("Ana") for _ in range(5)]
        self.assertEqual(recognition.points_by_person(offers), {"Ana": 1})

    def test_points_add_across_projects(self):
        offers = [offer("Ana", project="water-quality-sensing"), offer("Ana", project="brownfield-siting")]
        self.assertEqual(recognition.points_by_person(offers), {"Ana": 2})

    def test_anonymous_earns_nothing(self):
        self.assertEqual(recognition.points_by_person([offer("Anonymous"), offer("")]), {})

    def test_general_offers_earn_nothing(self):
        self.assertEqual(recognition.points_by_person([offer("Ana", project="general")]), {})

    def test_names_match_regardless_of_case(self):
        offers = [offer("Ana"), offer("ana", project="brownfield-siting")]
        self.assertEqual(sum(recognition.points_by_person(offers).values()), 2)


class HotTests(unittest.TestCase):
    def test_three_named_people_make_a_project_hot(self):
        offers = [offer("Ana"), offer("Ben"), offer("Cy")]
        self.assertEqual(recognition.hot_projects(offers, NOW), ["water-quality-sensing"])

    def test_two_people_is_not_hot(self):
        self.assertEqual(recognition.hot_projects([offer("Ana"), offer("Ben")], NOW), [])

    def test_anonymous_offers_never_make_hot(self):
        offers = [offer("Anonymous"), offer("Anonymous"), offer("Anonymous"), offer("Anonymous")]
        self.assertEqual(recognition.hot_projects(offers, NOW), [])

    def test_repeat_offers_from_one_person_count_once(self):
        offers = [offer("Ana"), offer("Ana"), offer("Ana")]
        self.assertEqual(recognition.hot_projects(offers, NOW), [])

    def test_old_offers_fall_out_of_the_window(self):
        offers = [offer("Ana", days_ago=40), offer("Ben"), offer("Cy")]
        self.assertEqual(recognition.hot_projects(offers, NOW), [])


class BadgeTests(unittest.TestCase):
    def test_thresholds(self):
        self.assertEqual(recognition.badges_for(4), [])
        self.assertEqual(recognition.badges_for(5), ["Helper"])
        self.assertEqual(recognition.badges_for(20), ["Connector", "Helper"])
        self.assertEqual(recognition.badges_for(50), ["Steward", "Connector", "Helper"])


class StatusTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.dir = Path(self.tmp.name)
        self.path = self.dir / "2026-10-30T120000Z-ana-abc123.json"
        self.path.write_text(json.dumps({
            "id": "2026-10-30T120000Z-ana-abc123", "name": "Ana", "project": "water-quality-sensing",
            "type": "expertise", "status": "offered", "submitted": NOW.isoformat()}), encoding="utf-8")

    def tearDown(self):
        self.tmp.cleanup()

    def test_accept_then_complete_with_confirmation(self):
        offer_tool.advance_offer("2026-10-30T120000Z-ana-abc123", "accepted", offers_dir=self.dir, now=NOW)
        result = offer_tool.advance_offer("2026-10-30T120000Z-ana-abc123", "completed",
                                          confirmed_by="Project lead", offers_dir=self.dir, now=NOW)
        self.assertEqual(result["status"], "completed")
        self.assertEqual(result["confirmed_by"], "Project lead")

    def test_completion_needs_a_confirmer(self):
        with self.assertRaisesRegex(ValueError, "confirmed-by"):
            offer_tool.advance_offer("2026-10-30T120000Z-ana-abc123", "completed", "", offers_dir=self.dir)

    def test_status_cannot_go_backwards(self):
        offer_tool.advance_offer("2026-10-30T120000Z-ana-abc123", "completed",
                                 confirmed_by="Lead", offers_dir=self.dir)
        with self.assertRaisesRegex(ValueError, "cannot move"):
            offer_tool.advance_offer("2026-10-30T120000Z-ana-abc123", "accepted", offers_dir=self.dir)

    def test_unknown_offer_rejected(self):
        with self.assertRaisesRegex(ValueError, "no offer"):
            offer_tool.advance_offer("missing", "accepted", offers_dir=self.dir)

    def test_completed_offer_scores_ten(self):
        offer_tool.advance_offer("2026-10-30T120000Z-ana-abc123", "completed",
                                 confirmed_by="Lead", offers_dir=self.dir)
        offers = recognition.load_offers(self.dir)
        self.assertEqual(recognition.points_by_person(offers), {"Ana": 10})


class ReportTests(unittest.TestCase):
    def test_report_lists_hot_projects_and_badges_without_contacts(self):
        offers = [offer("Ana"), offer("Ben"), offer("Cy", status="completed")]
        for item in offers:
            item["contact"] = "secret@example.org"
        text, hot, totals = recognition.report(offers, NOW)
        self.assertIn("water-quality-sensing: offers from 3+ people", text)
        self.assertNotIn("secret@example.org", text)
        self.assertEqual(totals["Cy"], 10)

    def test_report_has_no_leaderboard_ordering_claims(self):
        text, _, _ = recognition.report([offer("Ana")], NOW)
        self.assertNotIn("rank", text.lower())


if __name__ == "__main__":
    unittest.main()
