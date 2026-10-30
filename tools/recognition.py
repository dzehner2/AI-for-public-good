#!/usr/bin/env python3
"""Recognition for offers of help: points, 'hot' projects, and digital badges.

Design rules (see docs/recognition.md):
- Points reward help, not talk. An offer earns a little. Accepted help earns more. Completed help,
  confirmed by the project lead, earns the most.
- Each person earns at most one stage's points per project, so posting many offers to one project
  earns nothing extra.
- A project is 'hot' when several different named people have offered help recently. Anonymous
  offers never count toward 'hot', because one person could post them many times.
- Badges are recognition thresholds. There is no leaderboard and no ranking of people against each other.
- Only credited names appear in the report. Contact details never do.

Usage (from the repo root):
    python3 tools/recognition.py          # print the report and write offers/RECOGNITION.md

Standard library only.
"""

import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import offer as offer_tool  # noqa: E402  (reuses the offer storage and status order)

POINTS_BY_STATUS = {"offered": 1, "accepted": 3, "completed": 10}
HOT_WINDOW = timedelta(days=30)
HOT_MIN_PEOPLE = 3
BADGES = [("Helper", 5), ("Connector", 20), ("Steward", 50)]  # (name, points needed)
GENERAL = "general"
ANONYMOUS = "anonymous"


def load_offers(offers_dir=offer_tool.OFFERS_DIR):
    if not offers_dir.exists():
        return []
    offers = []
    for path in sorted(offers_dir.glob("*.json")):
        offer = json.loads(path.read_text(encoding="utf-8"))
        offer.setdefault("status", "offered")
        offers.append(offer)
    return offers


def person_key(name):
    """Return a comparison key for a credited name, or None if the offer can't earn recognition."""
    cleaned = (name or "").strip()
    if not cleaned or cleaned.lower() == ANONYMOUS:
        return None
    return cleaned.lower()


def points_by_person(offers):
    """Total points per credited person. One stage's points per person per project."""
    best = {}  # (person key, project) -> (display name, best points)
    for offer in offers:
        key = person_key(offer.get("name"))
        if key is None or offer["project"] == GENERAL:
            continue
        earned = POINTS_BY_STATUS[offer.get("status", "offered")]
        pair = (key, offer["project"])
        display, previous = best.get(pair, (offer["name"].strip(), 0))
        best[pair] = (display, max(previous, earned))
    totals = {}
    for (key, _project), (display, earned) in best.items():
        totals.setdefault(key, [display, 0])
        totals[key][1] += earned
    return {display: total for display, total in totals.values()}


def hot_projects(offers, now):
    """Projects with offers from several different named people in the recent window."""
    people = {}
    for offer in offers:
        key = person_key(offer.get("name"))
        if key is None or offer["project"] == GENERAL:
            continue
        submitted = datetime.fromisoformat(offer["submitted"])
        if now - submitted <= HOT_WINDOW:
            people.setdefault(offer["project"], set()).add(key)
    return sorted(project for project, who in people.items() if len(who) >= HOT_MIN_PEOPLE)


def badges_for(points):
    """Badges a person has earned, highest first."""
    earned = [name for name, needed in BADGES if points >= needed]
    return list(reversed(earned))


def report(offers, now):
    lines = ["# Recognition Report", "",
             f"Generated {now.isoformat(timespec='seconds')}. Private: contains credited names.", ""]

    hot = hot_projects(offers, now)
    lines += ["## Hot projects", ""]
    if hot:
        lines += [f"- {project}: offers from {HOT_MIN_PEOPLE}+ people in the last "
                  f"{HOT_WINDOW.days} days" for project in hot]
    else:
        lines.append("None yet.")
    lines.append("")

    totals = points_by_person(offers)
    lines += ["## Points and badges", ""]
    if totals:
        for person in sorted(totals, key=lambda p: (-totals[p], p.lower())):
            badges = ", ".join(badges_for(totals[person])) or "no badge yet"
            plural = "" if totals[person] == 1 else "s"
            lines.append(f"- {person}: {totals[person]} point{plural} ({badges})")
    else:
        lines.append("No credited offers yet.")
    lines.append("")
    return "\n".join(lines), hot, totals


def main(argv=None):
    now = datetime.now(timezone.utc)
    offers = load_offers()
    text, hot, totals = report(offers, now)
    offers_dir = offer_tool.OFFERS_DIR
    offers_dir.mkdir(exist_ok=True)
    (offers_dir / "RECOGNITION.md").write_text(text + "\n", encoding="utf-8")
    print(text)
    return 0


if __name__ == "__main__":
    sys.exit(main())
