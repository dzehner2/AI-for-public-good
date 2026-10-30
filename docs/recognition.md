# Recognition for Offers of Help

This is how the community notices and thanks people who help. It is designed to reward real help,
and to resist the ways gamified systems usually go wrong.

## What gets recognized

| Stage | Who sets it | Points |
|---|---|---|
| Offered | Member, through `tools/offer.py` | 1 |
| Accepted | Maintainer, when the project takes the offer up | 3 |
| Completed | Maintainer, only with the project lead's name recorded as confirmation | 10 |

Each person earns the points for their highest stage on each project, once. Ten offers to the same
project earn 1 point, not 10.

## Hot projects

A project is labeled **hot** when offers have come from at least three different named people in the
last 30 days. Anonymous offers don't count. This is deliberate: one person posting several anonymous offers
could make a project look hot, and a label that can be faked isn't worth having.

"Hot" means the project needs more hands, so it is a call for help, not a ranking of what matters most.

## Badges

Badges are thresholds in total points, not a ranking of people:

| Badge | Points |
|---|---|
| Helper | 5 |
| Connector | 20 |
| Steward | 50 |

There is no leaderboard. People are not shown in order of points, and the report doesn't compare
them.

## Why the rules are shaped this way

- **Completed help earns the most.** Offers are easy to make and cost nothing. Help that a project
  lead confirms has happened is what the community needs.
- **The lead's confirmation is required.** Without it, anyone could claim points for help they never gave.
- **One stage per project per person.** This stops people from farming points by posting the same offer
  again and again.
- **No leaderboard.** The community's reciprocity model depends on gifts, not competition. Ranking people
  would turn gifts into a contest, which the lens review in `docs/lens-review.md` flagged as a risk.
- **Money counts as an offer like any other.** It earns recognition only when it is completed and confirmed,
  and it is never tied to a badge purchase or special status.

## Known limits

- The points system can't tell whether help was good. A confirmed completion means the lead says the help
  happened. It doesn't measure its quality. The lead is the check, so their confirmation should be
  honest, and a convener should review any pattern that looks off.
- Names are self-chosen, so the same person could use two names. The recognition report is private for this
  reason, and a convener should merge duplicates by hand.
- Badges are digital records held in the private repository, not public credentials. Publishing them is a
  later decision.

## How to use it

```
python3 tools/offer.py add --type expertise --project water-quality-sensing --name "Ana" --details "..."
python3 tools/offer.py status <offer-id> --to accepted
python3 tools/offer.py status <offer-id> --to completed --confirmed-by "Project lead name"
python3 tools/recognition.py          # prints the report and writes offers/RECOGNITION.md
```

The offers folder is git-ignored, so the report stays local. Back it up somewhere private.
