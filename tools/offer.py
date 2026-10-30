#!/usr/bin/env python3
"""Record and summarize offers of time, expertise, resources, ideas, network, or money.

Each offer is one JSON file under offers/. Contact details are stored only when the person
has said yes to sharing them. Offers stay local: offers/ is git-ignored because it holds
personal information.

Usage (from the repo root):
    python3 tools/offer.py add --type expertise --project water-quality-sensing \
        --name "Ana" --details "Can calibrate low-cost turbidity sensors" --share-contact --contact "ana@example.org"
    python3 tools/offer.py add --type ideas --project general --name "Anonymous" --details "A residents' hearing checklist"
    python3 tools/offer.py summary

Standard library only.
"""

import argparse
import json
import re
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OFFERS_DIR = ROOT / "offers"
IDEAS_DIR = ROOT / "ideas"

TYPES = ["time", "expertise", "resources", "ideas", "network", "money"]
MAX_DETAILS = 1000
MAX_NAME = 80
GENERAL = "general"


def project_exists(project, ideas_dir=IDEAS_DIR):
    return project == GENERAL or (ideas_dir / f"{project}.md").exists()


def build_offer(args, ideas_dir=IDEAS_DIR, now=None):
    """Validate the arguments and return an offer dict. Raises ValueError with a plain message."""
    if args.type not in TYPES:
        raise ValueError(f"type must be one of: {', '.join(TYPES)}")
    if not project_exists(args.project, ideas_dir):
        raise ValueError(f"no idea card named '{args.project}' (use 'general' for the community)")
    name = (args.name or "").strip() or "Anonymous"
    if len(name) > MAX_NAME:
        raise ValueError(f"name must be {MAX_NAME} characters or fewer")
    details = (args.details or "").strip()
    if not details:
        raise ValueError("details are required: say what you can offer")
    if len(details) > MAX_DETAILS:
        raise ValueError(f"details must be {MAX_DETAILS} characters or fewer")
    if args.share_contact and not args.contact:
        raise ValueError("--share-contact needs --contact")

    offer = {
        "type": args.type,
        "project": args.project,
        "name": name,
        "details": details,
        "available": (args.available or "").strip(),
        "contact": args.contact.strip() if args.share_contact else None,
        "submitted": (now or datetime.now(timezone.utc)).isoformat(timespec="seconds"),
    }
    return offer


def save_offer(offer, offers_dir=OFFERS_DIR):
    offers_dir.mkdir(exist_ok=True)
    stamp = offer["submitted"].replace(":", "").replace("+00", "Z")
    slug = re.sub(r"[^a-z0-9]+", "-", offer["name"].lower()).strip("-")[:30] or "anonymous"
    # The random suffix keeps two offers from the same person in the same second from colliding.
    path = offers_dir / f"{stamp}-{slug}-{uuid.uuid4().hex[:6]}.json"
    offer = dict(offer, id=path.stem, status="offered")
    path.write_text(json.dumps(offer, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return path


# An offer moves forward only: offered -> accepted -> completed.
# Completion needs a named project lead to confirm the help was given.
STATUS_ORDER = ["offered", "accepted", "completed"]


def advance_offer(offer_id, status, confirmed_by="", offers_dir=OFFERS_DIR, now=None):
    """Move one offer forward. Raises ValueError with a plain message if the move is not allowed."""
    if status not in STATUS_ORDER[1:]:
        raise ValueError("status must be 'accepted' or 'completed'")
    if status == "completed" and not confirmed_by.strip():
        raise ValueError("completing an offer needs --confirmed-by: the project lead who confirmed the help")
    matches = [p for p in offers_dir.glob("*.json") if p.stem == offer_id] if offers_dir.exists() else []
    if not matches:
        raise ValueError(f"no offer with id '{offer_id}'")
    path = matches[0]
    offer = json.loads(path.read_text(encoding="utf-8"))
    current = offer.get("status", "offered")
    if STATUS_ORDER.index(status) <= STATUS_ORDER.index(current):
        raise ValueError(f"offer is already '{current}'; it cannot move to '{status}'")
    offer["status"] = status
    offer["status_updated"] = (now or datetime.now(timezone.utc)).isoformat(timespec="seconds")
    if status == "completed":
        offer["confirmed_by"] = confirmed_by.strip()
    path.write_text(json.dumps(offer, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return offer


def summarize(offers_dir=OFFERS_DIR):
    """Count offers by project and type. Contact details are never printed."""
    if not offers_dir.exists():
        return {}
    counts = {}
    for path in sorted(offers_dir.glob("*.json")):
        offer = json.loads(path.read_text(encoding="utf-8"))
        per_project = counts.setdefault(offer["project"], {})
        per_project[offer["type"]] = per_project.get(offer["type"], 0) + 1
    return counts


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)

    add = sub.add_parser("add", help="record an offer")
    add.add_argument("--type", required=True, choices=TYPES)
    add.add_argument("--project", required=True, help="idea card id, or 'general'")
    add.add_argument("--name", default="", help="name to credit, or leave blank for Anonymous")
    add.add_argument("--details", required=True, help="what you can offer")
    add.add_argument("--available", default="", help="when you are available, e.g. 'evenings'")
    add.add_argument("--share-contact", action="store_true", help="the person agreed to be contacted")
    add.add_argument("--contact", default="", help="contact details, used only with --share-contact")

    sub.add_parser("summary", help="count offers by project and type")

    move = sub.add_parser("status", help="mark an offer accepted or completed")
    move.add_argument("offer_id", help="the id printed when the offer was saved")
    move.add_argument("--to", required=True, choices=STATUS_ORDER[1:])
    move.add_argument("--confirmed-by", default="", help="required for 'completed': the project lead")

    args = parser.parse_args(argv)
    if args.command == "status":
        try:
            advance_offer(args.offer_id, args.to, args.confirmed_by)
        except ValueError as exc:
            print(f"Not updated: {exc}", file=sys.stderr)
            return 1
        print(f"Offer {args.offer_id} is now '{args.to}'")
        return 0
    if args.command == "add":
        try:
            offer = build_offer(args)
        except ValueError as exc:
            print(f"Not saved: {exc}", file=sys.stderr)
            return 1
        path = save_offer(offer)
        print(f"Saved offer for '{offer['project']}' ({offer['type']}) to {path.relative_to(ROOT)}")
        return 0

    counts = summarize()
    if not counts:
        print("No offers yet.")
        return 0
    for project in sorted(counts):
        parts = ", ".join(f"{t}: {n}" for t, n in sorted(counts[project].items()))
        print(f"{project}: {parts}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
