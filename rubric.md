# Scoring Rubric

Each idea is scored 1 to 5 on eight criteria. Use the anchors below; if you cannot justify
a score in one sentence, lower it and note the gap under "Open questions".

## Outcome criteria (the four public-good domains)

| Key       | Criterion         | 1                                 | 3                                              | 5                                                       |
|-----------|-------------------|-----------------------------------|-------------------------------------------------|---------------------------------------------------------|
| `water`   | Water impact      | No measurable effect              | Improves a local supply, quality, or leak rate  | Measurably improves quality or supply for a stressed system at scale |
| `air`     | Air impact        | No measurable effect              | Detects or reduces a local emission source      | Reduces emissions or exposure across a region, verified |
| `land`    | Land impact       | No measurable effect              | Improves siting, restoration, or land use locally | Restores or protects land at scale with monitored outcomes |
| `community` | Community impact | Serves a narrow or affluent group | Serves a defined community with clear access    | Builds local capacity, access, and governance for the least-resourced |

## Feasibility and risk criteria

| Key          | Criterion        | 1                                    | 3                                          | 5                                                |
|--------------|------------------|--------------------------------------|---------------------------------------------|--------------------------------------------------|
| `feasibility` | Feasibility     | Needs new science or unavailable hardware | Proven parts, a new integration           | Off-the-shelf parts, a known team can ship in months |
| `data`       | Data readiness   | No usable data and no path to it     | Data exists but needs collection or cleaning | Good data exists with clear access and rights    |
| `governance` | Governance risk  | Serious privacy, consent, or equity risk, no mitigation | Risks identified with partial mitigation | Low risk; consent, audit, and community control designed in |
| `footprint`  | Net footprint    | AI use likely exceeds the benefit    | Benefit roughly offsets AI use, unquantified | Clearly net-positive, with the arithmetic shown  |

**Note on `governance` and `footprint`:** higher is better (5 = low risk, 5 = clearly
net-positive). They are not inverted in the data, so the same direction applies to all keys.

## Weights

Weights are defined in `tools/build_index.py` and reflect the system's priorities:

| Criterion     | Weight |
|---------------|--------|
| footprint     | 2.0    |
| governance    | 2.0    |
| community     | 1.5    |
| water         | 1.5    |
| air           | 1.5    |
| land          | 1.5    |
| feasibility   | 1.0    |
| data          | 1.0    |

Total score = weighted average of the eight scores, rescaled so that all 1s give 0 and all 5s
give 100: `(weighted_average - 1) / 4 * 100`.

**Hard gates.** An idea with `footprint` or `governance` of 1 is marked "blocked" in the
index regardless of total score until the card records a mitigation and the score is revised.

## Calibration

Score at least three ideas in a session and compare them side by side before finalizing.
Scores are a ranking aid, not a measurement. Re-score after each pilot review.
