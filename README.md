# AI for Public Good: Research and Design System

A working system for researching, designing, and ranking project ideas that show how
AI data centers and AI systems can be built and operated to improve:

- **Water**: clean, reliable, affordable drinking and environmental water
- **Air**: cleaner air, fewer emissions, earlier warning of pollution
- **Land**: healthier soils, restored or better-used land, responsible siting
- **Community**: connected, informed, and self-governing communities

AI infrastructure has its own large footprint in electricity, water for cooling, land,
and hardware. This system therefore treats the **net footprint** of every idea as a
first-class criterion, not an afterthought. An idea that helps water but drains a
stressed aquifer does not pass.

## How the system works

```
Scan  ->  Frame  ->  Design  ->  Score  ->  Pilot  ->  Review
 |          |          |           |          |          |
sources   idea card   concept     rubric    test plan   lessons
            (template)  sketch   ranking   + metrics   fed back
```

| Stage   | What happens                                                                 | Where it lives                  |
|---------|------------------------------------------------------------------------------|---------------------------------|
| Scan    | Collect problems, data sources, and existing work in each domain             | `research/`                     |
| Frame   | Write one idea card: problem, who it serves, how AI is used, what it needs  | `ideas/` (from `templates/`)    |
| Design  | Sketch the system: data, compute location, operators, governance, footprint | Idea card "Design sketch" section |
| Score   | Rate against the rubric; the script ranks all cards                          | `rubric.md`, `tools/build_index.py` |
| Pilot   | Pick the top few, define a small test with a success metric and a stop rule | Idea card "Pilot plan" section  |
| Review  | Record what happened; update scores and status                               | Idea card "Review log" section  |

## Folder layout

```
ai-for-public-good/
  README.md            this file
  principles.md        design principles every idea must satisfy
  rubric.md            scoring criteria, scale, and weights
  research/
    agenda.md          open questions to research next
    sources.md         source types to check and how to evaluate them
  templates/
    idea-card.md       blank card to copy when framing a new idea
  ideas/               one markdown file per idea
  tools/
    build_index.py     validates idea cards and writes INDEX.md
  INDEX.md             generated ranking (do not edit by hand)
```

## Adding an idea

1. Copy `templates/idea-card.md` to `ideas/<short-slug>.md`.
2. Fill in the front matter and sections. Set one primary `domain` (water, air, land,
   community, or cross-cutting) and optionally one `secondary` domain.
3. Score it using `rubric.md`. Write one sentence of justification per score.
4. Run `python3 ai-for-public-good/tools/build_index.py` from the repo root.
   The script fails loudly on missing or out-of-range fields.
5. Commit the card and the regenerated `INDEX.md`.

## Ground rules for every card

- Name the **net footprint**: electricity, water, materials, and land the AI system
  uses, and what it displaces or offsets. Do not claim a benefit without this line.
- Name the **data** the system needs, who owns it, and what consent or agreement is required.
- Name the **decision-maker** a human still holds. AI recommends; accountable people decide.
- Name the **failure mode** that would hurt the community most, and how it is detected.
- Mark anything that is a hypothesis as a hypothesis. Unverified numbers belong in
  "Open questions", not in the summary.

## Status values

`seed` (idea captured) -> `researching` (sources and data being checked) -> `designed`
(sketch complete and scored) -> `piloting` (test running) -> `scaled` or `retired`.
