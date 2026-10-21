---
id: pipe-leak-detection
title: AI leak detection to reduce water loss in municipal pipes
status: seed
domain: water
secondary: community
owner:
score_water: 4
score_air: 2
score_land: 1
score_community: 3
score_feasibility: 4
score_data: 3
score_governance: 4
score_footprint: 4
---

# AI leak detection to reduce water loss in municipal pipes

## Problem

Water lost through leaking pipes is treated water that was paid for in energy and chemicals
and never reaches a customer. Losses are higher in older systems, and detection often waits
for a visible break or a bill anomaly.

## Who it serves

Ratepayers, especially in systems that cannot afford repeated emergency repairs; the
environment, because lost water is often pumped from a stressed source.

## Idea

Combine flow, pressure, and acoustic data from existing meters and new sensors with a model
that separates normal demand from leak signatures. Rank suspected leaks by water loss and
repair cost, and send crews a prioritized work list.

## How AI is used

- Inputs: district meter area flow and pressure; acoustic logger data where installed;
  pipe age and material records; repair history
- Method: leak signature classification; ranking by estimated loss and consequence
- Outputs and who acts on them: a weekly ranked list for field crews; crews verify on site
- Human decision point: crews verify; engineers decide repairs and capital priorities

## Design sketch

- Data sources and owners: utility (meters, SCADA, GIS and repair records)
- Where compute or sensing runs: analytics can run on utility servers; no need for public cloud
  if utility policy requires on-premises
- Power source and when it runs: standard utility power; batch processing is low-load
- Water use, and its source: none
- Net footprint arithmetic: the water and energy recovered from fewer leaks should exceed the
  compute and sensor energy by a wide margin; confirm with the utility's own loss and pumping data
- Governance: utility data used for operations only; customer-level consumption data is
  aggregated before any analysis that leaves the utility
- Failure mode that hurts most: missed major break. Detection: normal emergency reporting remains
  primary; the model supplements it and never replaces it.

## Pilot plan

- Scope and location: one district metered area with known loss history
- Duration and size: 6 months
- Success metric: share of ranked leaks confirmed by crews; reduction in non-revenue water in the pilot area
- Stop rule: confirmed-leak rate below an agreed threshold after the first two months
- Partners needed: water utility operations and GIS teams

## Open questions

- What is the utility's current non-revenue water rate and how is it measured?
- Are meter and pressure data available at the resolution the model needs?

## Sources

- To add: utility audit reports (AWWA-style water balance or equivalent in the jurisdiction); field validation studies

## Review log

| Date | Event | Score or status change | Notes |
|------|-------|------------------------|-------|
| — | Seed captured | — | Strong fit; needs a utility partner |
