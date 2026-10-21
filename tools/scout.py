#!/usr/bin/env python3
"""Scout: collect new items from public feeds that match the community's topics.

Reads source feeds from scout/sources.json, fetches RSS or Atom feeds, keeps items that match
the topic keywords, and appends them to scout/inbox.jsonl for human triage. Only feed metadata
(title, link, date, short summary) is stored. Article bodies are never fetched.

Usage (from the repo root):
    python3 tools/scout.py                      # run every enabled source
    python3 tools/scout.py --fixture FILE.xml --name test   # parse a local feed (testing)

Standard library only. Respects robots.txt and waits between requests to the same host.
"""

import argparse
import hashlib
import html
import json
import re
import sys
import time
import urllib.parse
import urllib.request
import urllib.robotparser
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCOUT_DIR = ROOT / "scout"
SOURCES_PATH = SCOUT_DIR / "sources.json"
INBOX_PATH = SCOUT_DIR / "inbox.jsonl"
SEEN_PATH = SCOUT_DIR / "seen.json"

USER_AGENT = "ai-for-public-good-scout/0.1 (research triage; contact: set in sources.json)"
REQUEST_DELAY_SECONDS = 5
TIMEOUT_SECONDS = 20
SUMMARY_CHARS = 400

# Topic keywords, grouped by the community's domains. An item matches if its title or
# summary contains at least one term. Matching is a triage aid, not a judgment.
TOPICS = {
    "water": ["data center water", "water use", "water stress", "reclaimed water", "water leak",
              "water quality", "aquifer", "watershed"],
    "air": ["data center emissions", "methane", "air quality", "air monitor", "grid carbon"],
    "land": ["brownfield", "land use", "data center siting", "habitat", "soil restoration"],
    "community": ["community benefit", "data center agreement", "data sovereignty", "public comment",
                  "community data", "civic technology"],
    "cognition": ["cognitive offloading", "critical thinking", "ai and learning", "human judgment"],
}

TAG_RE = re.compile(r"<[^>]+>")
SPACE_RE = re.compile(r"\s+")


def clean(text):
    if not text:
        return ""
    text = html.unescape(TAG_RE.sub(" ", text))
    return SPACE_RE.sub(" ", text).strip()


def matches(text):
    """Return the topic domains whose keywords appear in the text."""
    lowered = text.lower()
    return sorted(domain for domain, terms in TOPICS.items() if any(t in lowered for t in terms))


def item_id(link, title):
    return hashlib.sha256(f"{link}|{title}".encode("utf-8")).hexdigest()[:16]


def parse_feed(xml_bytes, source_name):
    """Parse RSS 2.0 or Atom into a list of item dicts (no matching applied yet)."""
    root = ET.fromstring(xml_bytes)
    ns = {"atom": "http://www.w3.org/2005/Atom"}
    entries = []
    if root.tag.endswith("feed"):  # Atom
        for entry in root.findall("atom:entry", ns):
            link_el = entry.find("atom:link[@rel='alternate']", ns)
            if link_el is None:
                link_el = entry.find("atom:link", ns)
            entries.append({
                "title": clean(entry.findtext("atom:title", default="", namespaces=ns)),
                "link": link_el.get("href", "") if link_el is not None else "",
                "published": entry.findtext("atom:updated", default="", namespaces=ns),
                "summary": clean(entry.findtext("atom:summary", default="", namespaces=ns)
                                 or entry.findtext("atom:content", default="", namespaces=ns)),
            })
    else:  # RSS
        for item in root.iter("item"):
            entries.append({
                "title": clean(item.findtext("title", default="")),
                "link": (item.findtext("link", default="") or "").strip(),
                "published": item.findtext("pubDate", default=""),
                "summary": clean(item.findtext("description", default="")),
            })
    for entry in entries:
        entry["source"] = source_name
        entry["summary"] = entry["summary"][:SUMMARY_CHARS]
    return entries


def allowed_by_robots(url, user_agent, cache):
    parts = urllib.parse.urlsplit(url)
    origin = f"{parts.scheme}://{parts.netloc}"
    if origin not in cache:
        parser = urllib.robotparser.RobotFileParser()
        try:
            req = urllib.request.Request(origin + "/robots.txt", headers={"User-Agent": user_agent})
            with urllib.request.urlopen(req, timeout=TIMEOUT_SECONDS) as resp:
                parser.parse(resp.read().decode("utf-8", errors="replace").splitlines())
        except Exception:
            # No readable robots.txt: treat as allowed, as crawlers conventionally do.
            parser.parse([])
        cache[origin] = parser
    return cache[origin].can_fetch(user_agent, url)


def load_json(path, default):
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return default


def run(sources, contact):
    user_agent = f"{USER_AGENT}; {contact}" if contact else USER_AGENT
    seen = set(load_json(SEEN_PATH, []))
    robots_cache = {}
    last_request = {}
    new_items = []
    report = []

    for source in sources:
        if not source.get("enabled", True):
            continue
        url = source["url"]
        host = urllib.parse.urlsplit(url).netloc
        if not allowed_by_robots(url, user_agent, robots_cache):
            report.append(f"{source['name']}: skipped, disallowed by robots.txt")
            continue
        wait = REQUEST_DELAY_SECONDS - (time.time() - last_request.get(host, 0))
        if wait > 0:
            time.sleep(wait)
        try:
            req = urllib.request.Request(url, headers={"User-Agent": user_agent})
            with urllib.request.urlopen(req, timeout=TIMEOUT_SECONDS) as resp:
                body = resp.read()
            last_request[host] = time.time()
            entries = parse_feed(body, source["name"])
        except Exception as exc:  # network or parse failure: record and continue
            report.append(f"{source['name']}: failed ({type(exc).__name__})")
            continue
        for entry in entries:
            entry["tier"] = source.get("tier", "unrated")
        added = collect(entries, seen, new_items)
        report.append(f"{source['name']}: {len(entries)} items, {added} new matches")

    write_results(new_items, seen)
    return report, new_items


def collect(entries, seen, out):
    added = 0
    for entry in entries:
        if not entry["link"] or not entry["title"]:
            continue
        key = item_id(entry["link"], entry["title"])
        if key in seen:
            continue
        domains = matches(f"{entry['title']} {entry['summary']}")
        seen.add(key)
        if not domains:
            continue
        entry.update({"id": key, "domains": domains,
                      "found": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                      "status": "new"})
        out.append(entry)
        added += 1
    return added


def write_results(items, seen):
    SCOUT_DIR.mkdir(exist_ok=True)
    with INBOX_PATH.open("a", encoding="utf-8") as fh:
        for item in items:
            fh.write(json.dumps(item, ensure_ascii=False) + "\n")
    SEEN_PATH.write_text(json.dumps(sorted(seen)), encoding="utf-8")


def write_digest(day):
    """Write a newsletter draft from inbox items still marked 'new', then mark them 'digested'.

    The draft is for human review. Nothing is sent from here.
    """
    if not INBOX_PATH.exists():
        return None
    lines = INBOX_PATH.read_text(encoding="utf-8").splitlines()
    items = [json.loads(line) for line in lines if line.strip()]
    pending = [item for item in items if item.get("status") == "new"]
    if not pending:
        return None

    by_domain = {}
    for item in pending:
        by_domain.setdefault(item["domains"][0], []).append(item)

    out = [f"# Community Scan: {day}", "",
           "Draft for review before sending. Items come from public feeds and are not endorsed.", ""]
    for domain in sorted(by_domain):
        out.append(f"## {domain.capitalize()}")
        out.append("")
        for item in by_domain[domain]:
            rating = item.get("tier", "unrated")
            note = " (source not yet rated)" if rating == "unrated" else ""
            out.append(f"- [{item['title']}]({item['link']}) — {item['source']}, {rating}{note}")
            if item.get("summary"):
                out.append(f"  {item['summary']}")
        out.append("")

    path = SCOUT_DIR / f"digest-{day}.md"
    path.write_text("\n".join(out), encoding="utf-8")

    for item in items:
        if item.get("status") == "new":
            item["status"] = "digested"
    INBOX_PATH.write_text("".join(json.dumps(i, ensure_ascii=False) + "\n" for i in items), encoding="utf-8")
    return path


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--fixture", help="parse a local feed file instead of fetching")
    parser.add_argument("--name", default="fixture", help="source name for --fixture")
    parser.add_argument("--digest", action="store_true", help="write a newsletter draft from new items and exit")
    args = parser.parse_args(argv)

    if args.digest:
        path = write_digest(datetime.now(timezone.utc).strftime("%Y-%m-%d"))
        print(f"Wrote {path.relative_to(ROOT)}" if path else "No new items to digest.")
        return 0

    if args.fixture:
        entries = parse_feed(Path(args.fixture).read_bytes(), args.name)
        items = []
        seen = set(load_json(SEEN_PATH, []))
        added = collect(entries, seen, items)
        write_results(items, seen)
        print(f"{args.name}: {len(entries)} items, {added} new matches")
        return 0

    config = load_json(SOURCES_PATH, {"contact": "", "sources": []})
    if not config["sources"]:
        print("No sources configured in scout/sources.json. Nothing to do.")
        return 0
    report, items = run(config["sources"], config.get("contact", ""))
    print("\n".join(report))
    print(f"{len(items)} new matches written to {INBOX_PATH.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
