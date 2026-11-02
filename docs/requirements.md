# Requirements

Each requirement has an ID, a priority, and an acceptance check. Where a check is automated,
it names the test in `tests/`. Requirements marked **Planned** are not yet implemented.

Priority: **M** = must have for Day 90, **S** = should have, **C** = could have.

## Functional requirements

### Idea cards and validation

| ID | Requirement | Pri | Acceptance check | Status |
|----|-------------|-----|------------------|--------|
| REQ-F1 | Every idea card has front matter with `id`, `title`, `status`, `domain` | M | `test_missing_required_fields_reported` | Met |
| REQ-F2 | Card `id` must equal its filename | M | `test_id_must_match_filename` | Met |
| REQ-F3 | `domain` is one of water, air, land, community, cross-cutting | M | `test_invalid_domain_reported` | Met |
| REQ-F4 | `status` is one of seed, researching, designed, piloting, scaled, retired | M | `test_invalid_status_reported` | Met |
| REQ-F5 | Each of the eight scores is an integer 1–5; missing or out-of-range scores fail | M | `test_score_out_of_range_reported`, `test_missing_score_reported` | Met |
| REQ-F6 | The builder exits non-zero if any card is invalid, and writes no index | M | `test_invalid_card_exits_nonzero` | Met |

### Scoring and ranking

| ID | Requirement | Pri | Acceptance check | Status |
|----|-------------|-----|------------------|--------|
| REQ-S1 | Total score is the weighted average, rescaled so all 1s = 0 and all 5s = 100 | M | `test_all_fives_is_100`, `test_all_ones_is_0` | Met |
| REQ-S2 | Weights match rubric.md (footprint 2, governance 2, others 1–1.5) | M | `test_weights_match_rubric` | Met |
| REQ-S3 | A score of 1 on footprint or governance blocks the idea from the ranking | M | `test_gate_blocks_idea` | Met |
| REQ-S4 | Ranked list is sorted by score descending, ties by id | M | Manual check of the ranked table in INDEX.md; automated test to add in Phase 0 | Met (manual) |
| REQ-S5 | Water-domain scores are calibrated: at least three ideas scored side by side and reviewed, with notes recorded | M | Manual: calibration note in `research/` exists and the review log of each water card has a calibration entry | Planned |

### Index output

| ID | Requirement | Pri | Acceptance check | Status |
|----|-------------|-----|------------------|--------|
| REQ-F7 | Builder writes `INDEX.md` with a ranked table, a by-domain view, and a blocked section | M | Run builder; confirm sections present | Met |
| REQ-F8 | Index links every idea to its card | M | Manual check of relative links | Met |
| REQ-F9 | Index is regenerated and committed with any card change | M | Process check in CONTRIBUTING (to write in Phase 0) | Planned |
| REQ-F10 | Web index: a browsable HTML version generated from the same data | S | HTML file generated; shows the same ranking as INDEX.md | Planned (pending O-3) |

### Proposal

| ID | Requirement | Pri | Acceptance check | Status |
|----|-------------|-----|------------------|--------|
| REQ-P1 | Written proposal (doc) covers problem, ranked water ideas, method, footprint arithmetic, pilot ask | M | Reviewed against this list by the team | Planned |
| REQ-P2 | Proposal states the scoring method and its limits | M | Section present and matches rubric.md | Planned |
| REQ-P3 | Proposal cites dated sources for every quantitative claim | M | Each figure links to a `sources.md` entry | Planned |
| REQ-P4 | Proposal names a partner candidate and a pilot scope, labeled as draft | M | Section present | Planned |
| REQ-P5 | Proposal has been reviewed by at least one external reviewer | M | Review note recorded | Planned |

### Research

| ID | Requirement | Pri | Acceptance check | Status |
|----|-------------|-----|------------------|--------|
| REQ-R1 | Every claim on a card is traced to a source or marked as a hypothesis | M | Manual review of each card before status moves to `designed` | Planned |
| REQ-R2 | Sources are logged with date, type, and caveat | M | `sources.md` log has ≥10 entries for water ideas by Week 5 | Planned |
| REQ-R3 | Water research questions 4 and 5 are closed or explicitly deferred | M | `research/agenda.md` updated | Planned |

## Non-functional requirements

| ID | Requirement | Pri | Acceptance check | Status |
|----|-------------|-----|------------------|--------|
| REQ-N1 | Builder uses the standard library only; runs on Python 3.8+ | M | Standard library only (verified by reading imports); tests pass on the local Python; 3.8 not yet checked | Partly met |
| REQ-N3 | Builder is deterministic: same cards give byte-identical INDEX.md | M | `test_index_is_deterministic` | Planned |
| REQ-N4 | No personal or partner data is stored in cards without consent | M | Review checklist before each commit | Planned |
| REQ-N5 | Footprint and governance criteria are never averaged away: a gate applies even when total is high | M | `test_gate_blocks_idea` | Met |

## Out of scope for Day 90

- Live data feeds from utilities or sensors
- Pilot execution
- Land and community cards beyond the seed set (scored, but not developed)
- Multi-user editing or authentication on the web index

## Open questions that affect requirements

- O-3: web index approach (affects REQ-F10)
- O-2: team sign-off on this document (required before Phase 1)
