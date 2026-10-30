"""Tests for tools/scout.py. Run from the repo root:

    python3 -m unittest discover -s tests -v
"""

import importlib.util
import tempfile
import unittest
from pathlib import Path
from unittest import mock

REPO = Path(__file__).resolve().parent.parent
SPEC = importlib.util.spec_from_file_location("scout", REPO / "tools" / "scout.py")
scout = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(scout)

RSS = b"""<?xml version="1.0"?>
<rss version="2.0"><channel><title>t</title>
<item><title>Town weighs data center water use limits</title>
<link>https://example.org/a</link><pubDate>Mon, 01 Jun 2026 00:00:00 GMT</pubDate>
<description>&lt;p&gt;Residents ask about water use and reclaimed water.&lt;/p&gt;</description></item>
<item><title>Sports results</title><link>https://example.org/b</link>
<description>Nothing relevant here.</description></item>
</channel></rss>"""

ATOM = b"""<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom"><title>t</title>
<entry><title>Study on cognitive offloading and critical thinking</title>
<link rel="alternate" href="https://example.org/c"/><updated>2026-06-02T00:00:00Z</updated>
<summary>A survey of AI use and critical thinking.</summary></entry>
</feed>"""


class ParseTests(unittest.TestCase):
    def test_rss_items_parsed_and_html_stripped(self):
        entries = scout.parse_feed(RSS, "rss-test")
        self.assertEqual(len(entries), 2)
        self.assertEqual(entries[0]["link"], "https://example.org/a")
        self.assertIn("reclaimed water", entries[0]["summary"])
        self.assertNotIn("<p>", entries[0]["summary"])
        self.assertEqual(entries[0]["source"], "rss-test")

    def test_atom_items_parsed(self):
        entries = scout.parse_feed(ATOM, "atom-test")
        self.assertEqual(len(entries), 1)
        self.assertEqual(entries[0]["link"], "https://example.org/c")
        self.assertEqual(entries[0]["published"], "2026-06-02T00:00:00Z")

    def test_summary_truncated(self):
        long = b"<rss><channel><item><title>x</title><link>https://e/x</link><description>" + b"w" * 1000 + b"</description></item></channel></rss>"
        entries = scout.parse_feed(long, "s")
        self.assertLessEqual(len(entries[0]["summary"]), scout.SUMMARY_CHARS)


class MatchingTests(unittest.TestCase):
    def test_relevant_text_matches_domain(self):
        self.assertEqual(scout.matches("data center water use"), ["water"])

    def test_irrelevant_text_matches_nothing(self):
        self.assertEqual(scout.matches("sports results"), [])

    def test_multiple_domains(self):
        self.assertEqual(scout.matches("methane and brownfield reuse"), ["air", "land"])

    def test_matching_is_case_insensitive(self):
        self.assertEqual(scout.matches("Data Center WATER USE"), ["water"])


class CollectTests(unittest.TestCase):
    def test_collect_keeps_matches_and_dedupes(self):
        entries = scout.parse_feed(RSS, "s")
        seen, out = set(), []
        first = scout.collect(entries, seen, out)
        second = scout.collect(entries, seen, out)
        self.assertEqual(first, 1)  # only the water item matches
        self.assertEqual(second, 0)  # nothing new on a second pass
        self.assertEqual(out[0]["domains"], ["water"])
        self.assertEqual(out[0]["status"], "new")

    def test_unmatched_items_are_marked_seen(self):
        entries = scout.parse_feed(RSS, "s")
        seen, out = set(), []
        scout.collect(entries, seen, out)
        self.assertEqual(len(seen), 2)


class RobotsTests(unittest.TestCase):
    def test_disallowed_path_is_refused(self):
        parser = scout.urllib.robotparser.RobotFileParser()
        parser.parse(["User-agent: *", "Disallow: /private"])
        cache = {"https://example.org": parser}
        self.assertFalse(scout.allowed_by_robots("https://example.org/private/x", scout.USER_AGENT, cache))
        self.assertTrue(scout.allowed_by_robots("https://example.org/feed", scout.USER_AGENT, cache))


class RunTests(unittest.TestCase):
    def test_disabled_source_is_skipped(self):
        with mock.patch.object(scout, "urllib") as fake, \
                mock.patch.object(scout, "write_results"), \
                mock.patch.object(scout, "load_json", return_value=[]):
            report, items = scout.run([{"name": "off", "url": "https://example.org/f", "enabled": False}], "ops@example.org")
        fake.request.Request.assert_not_called()
        self.assertEqual(report, [])
        self.assertEqual(items, [])

    def test_robots_disallow_is_reported_not_fetched(self):
        source = {"name": "blocked", "url": "https://example.org/f", "verified": True}
        with mock.patch.object(scout, "allowed_by_robots", return_value=False), \
                mock.patch.object(scout, "write_results"), \
                mock.patch.object(scout, "load_json", return_value=[]):
            report, _ = scout.run([source], "ops@example.org")
        self.assertEqual(report, ["blocked: skipped, disallowed by robots.txt"])

    def test_live_run_refused_without_contact(self):
        with mock.patch.object(scout.urllib.request, "urlopen") as fake_open:
            report, items = scout.run([{"name": "s", "url": "https://example.org/f", "verified": True}], "")
        fake_open.assert_not_called()
        self.assertTrue(report[0].startswith("refused"))
        self.assertEqual(items, [])

    def test_contact_is_in_user_agent(self):
        captured = {}

        def fake_request(url, headers=None, **kwargs):
            captured["ua"] = headers["User-Agent"]
            raise OSError("stop here")

        source = {"name": "s", "url": "https://example.org/f", "verified": True}
        with mock.patch.object(scout, "allowed_by_robots", return_value=True), \
                mock.patch.object(scout.urllib.request, "Request", side_effect=fake_request), \
                mock.patch.object(scout, "write_results"), \
                mock.patch.object(scout, "load_json", return_value=[]):
            scout.run([source], "ops@example.org")
        self.assertIn("ops@example.org", captured["ua"])

    def test_unverified_source_is_skipped(self):
        source = {"name": "unchecked", "url": "https://example.org/f", "verified": False}
        with mock.patch.object(scout, "allowed_by_robots") as robots, \
                mock.patch.object(scout, "write_results"), \
                mock.patch.object(scout, "load_json", return_value=[]):
            report, _ = scout.run([source], "ops@example.org")
        robots.assert_not_called()
        self.assertEqual(report, ["unchecked: skipped, source not yet verified"])

    def test_fixture_mode_writes_inbox(self):
        with tempfile.TemporaryDirectory() as tmp:
            feed = Path(tmp) / "feed.xml"
            feed.write_bytes(RSS)
            saved = (scout.SCOUT_DIR, scout.INBOX_PATH, scout.SEEN_PATH)
            scout.SCOUT_DIR = Path(tmp)
            scout.INBOX_PATH = Path(tmp) / "inbox.jsonl"
            scout.SEEN_PATH = Path(tmp) / "seen.json"
            try:
                code = scout.main(["--fixture", str(feed), "--name", "t"])
                lines = scout.INBOX_PATH.read_text(encoding="utf-8").splitlines()
            finally:
                scout.SCOUT_DIR, scout.INBOX_PATH, scout.SEEN_PATH = saved
        self.assertEqual(code, 0)
        self.assertEqual(len(lines), 1)


class DigestTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.dir = Path(self.tmp.name)
        self.saved = (scout.SCOUT_DIR, scout.INBOX_PATH)
        scout.SCOUT_DIR = self.dir
        scout.INBOX_PATH = self.dir / "inbox.jsonl"

    def tearDown(self):
        scout.SCOUT_DIR, scout.INBOX_PATH = self.saved
        self.tmp.cleanup()

    def write_inbox(self, items):
        import json
        scout.INBOX_PATH.write_text("".join(json.dumps(i) + "\n" for i in items), encoding="utf-8")

    def item(self, title, status, domains=("water",), tier="tier 1"):
        return {"title": title, "link": f"https://example.org/{title}", "source": "Src",
                "summary": "short", "domains": list(domains), "tier": tier, "status": status}

    def test_digest_includes_only_new_items_and_marks_them(self):
        import json
        self.write_inbox([self.item("fresh", "new"), self.item("old", "digested")])
        path = scout.write_digest("2026-06-03")
        text = path.read_text(encoding="utf-8")
        self.assertIn("[fresh]", text)
        self.assertNotIn("[old]", text)
        statuses = {json.loads(l)["title"]: json.loads(l)["status"]
                    for l in scout.INBOX_PATH.read_text(encoding="utf-8").splitlines()}
        self.assertEqual(statuses, {"fresh": "digested", "old": "digested"})

    def test_second_digest_is_empty(self):
        self.write_inbox([self.item("fresh", "new")])
        scout.write_digest("2026-06-03")
        self.assertIsNone(scout.write_digest("2026-06-04"))

    def test_digest_labels_unverified_sources(self):
        unverified = self.item("unchecked", "new", tier="tier 1")
        unverified["verified"] = False
        verified = self.item("checked", "new", tier="tier 1")
        verified["verified"] = True
        self.write_inbox([unverified, verified])
        text = scout.write_digest("2026-06-03").read_text(encoding="utf-8")
        self.assertIn("UNVERIFIED source", text)
        self.assertIn("verified source", text)

    def test_unrated_items_are_flagged(self):
        self.write_inbox([self.item("unknown", "new", tier="unrated")])
        text = scout.write_digest("2026-06-03").read_text(encoding="utf-8")
        self.assertIn("source not yet rated", text)

    def test_digest_groups_by_domain(self):
        self.write_inbox([self.item("w", "new", domains=("water",)), self.item("a", "new", domains=("air",))])
        text = scout.write_digest("2026-06-03").read_text(encoding="utf-8")
        self.assertIn("## Air", text)
        self.assertIn("## Water", text)


if __name__ == "__main__":
    unittest.main()
