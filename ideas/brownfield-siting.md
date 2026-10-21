---
id: brownfield-siting
title: Siting AI facilities on brownfields and degraded land first
status: seed
domain: land
secondary: water
owner:
score_water: 3
score_air: 2
score_land: 4
score_community: 3
score_feasibility: 3
score_data: 3
score_governance: 3
score_footprint: 3
---

# Siting AI facilities on brownfields and degraded land first

## Problem

New AI facilities are often proposed on greenfield land, which can mean habitat loss, farmland
conversion, and new water and power demand in places that have not been disturbed before.
Previously contaminated or degraded sites often sit unused.

## Who it serves

Communities with abandoned industrial or contaminated land who want reuse; ecosystems and
agricultural land that would otherwise be converted.

## Idea

Build a public screening tool that scores candidate parcels by land condition, contamination
history, existing infrastructure (power, water, transport), water stress, habitat value, and
community priorities. Use the screen to rank sites where AI facilities would cause the least
new disturbance and the most remediation benefit.

## How AI is used

- Inputs: land cover and imagery; contamination registries; parcel and zoning data; transmission
  and water infrastructure maps; habitat and water stress layers
- Method: multi-criteria screening with uncertainty; change detection on imagery to identify
  abandoned or degraded parcels
- Outputs and who acts on them: planners and developers see ranked candidate sites with trade-offs; residents review the same map
- Human decision point: local government decides zoning and approvals; community input is required before a site is advanced

## Design sketch

- Data sources and owners: government GIS and environmental agencies; public satellite data
- Where compute or sensing runs: cloud analysis, publicly hosted outputs
- Power source and when it runs: not applicable to the screen itself
- Water use, and its source: screening flags water stress as a constraint
- Net footprint arithmetic: the screen's own footprint is negligible. The benefit is avoided
  greenfield disturbance; quantify avoided acreage per siting decision.
- Governance: open methods; a public comment period before a site is advanced; no
  parcel-level decisions made by the model
- Failure mode that hurts most: a brownfield label that hides residual contamination. Detection:
  remediation records checked before any parcel is ranked high; uncertainty shown on each score.

## Pilot plan

- Scope and location: one county with a brownfield inventory and at least one AI facility proposal
- Duration and size: 9 months
- Success metric: share of approved sites that are brownfield or degraded; acres of new disturbance avoided
- Stop rule: a ranked site found to have unrecorded contamination that the screen did not flag
- Partners needed: county planning office, state environmental agency, a community group

## Open questions

- Do brownfield and contamination records cover the target county at useful resolution? (agenda item 8)
- How do the local zoning rules treat data center use on remediated land?

## Sources

- To add: state brownfield inventory; land cover datasets

## Review log

| Date | Event | Score or status change | Notes |
|------|-------|------------------------|-------|
| — | Seed captured | — | Land score depends on county data quality |
