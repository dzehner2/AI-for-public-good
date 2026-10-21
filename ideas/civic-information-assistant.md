---
id: civic-information-assistant
title: Multilingual civic information assistant for permits and public comment
status: seed
domain: community
secondary: air
owner:
score_water: 1
score_air: 2
score_land: 2
score_community: 5
score_feasibility: 4
score_data: 4
score_governance: 3
score_footprint: 4
---

# Multilingual civic information assistant for permits and public comment

## Problem

Permit applications, environmental reviews, and hearing notices are long, technical, and often
published only in English. Residents who want to comment on a data center, a waste facility, or
a water rate change often miss the deadline or cannot follow the issue.

## Who it serves

Residents with limited English, limited time, or limited familiarity with environmental and
land-use processes; community groups that run outreach.

## Idea

Provide an assistant that answers questions about a specific public process, with citations to
the official documents. It explains a permit in plain language and in the resident's language,
lists deadlines, helps draft a public comment, and points to the official way to submit it.
It never submits on a resident's behalf and never invents an answer.

## How AI is used

- Inputs: official documents for an active process (permit applications, environmental reviews,
  hearing notices, meeting minutes); the resident's question
- Method: retrieval over an official document set with source citations; plain-language
  summaries; translation with a review step for legal terms
- Outputs and who acts on them: residents read answers and decide what to do; agencies receive
  the comments through their normal channels
- Human decision point: the resident writes and submits the comment; agencies respond to comments

## Design sketch

- Data sources and owners: government agency publications (public); community group outreach materials
- Where compute or sensing runs: cloud service with a public, auditable document set; no
  personal data retained beyond the session unless the user opts in
- Power source and when it runs: standard hosting; modest load
- Water use, and its source: none
- Net footprint arithmetic: low compute per query; the benefit is informed participation. Track
  comments submitted and, if available, comments that change outcomes.
- Governance: every answer shows its source document and date; the assistant states when it
  is unsure and directs users to staff; open list of the documents it is allowed to use
- Failure mode that hurts most: a wrong deadline or a mistranslated legal term that causes a missed
  comment. Detection: deadline data pulled from the official notice, not from the model; bilingual
  human review for each supported language on each process.

## Pilot plan

- Scope and location: one county with an active, high-profile land-use process
- Duration and size: one process from notice through hearing
- Success metric: number of residents who submit a comment who used the tool; reviewed accuracy
  of answers on a sample of 50 questions
- Stop rule: any answer error that causes a missed deadline, or a reviewed accuracy below an agreed level
- Partners needed: county clerk or planning office, a community organization, a translation review partner

## Open questions

- How do residents currently find and understand notices? Where do they drop off? (agenda item 10)
- What accuracy and language coverage can be verified before launch? (agenda item 11)

## Sources

- To add: county public participation policies; accessibility and language access requirements in the jurisdiction

## Review log

| Date | Event | Score or status change | Notes |
|------|-------|------------------------|-------|
| — | Seed captured | — | Strong community fit; accuracy verification is the gate |
