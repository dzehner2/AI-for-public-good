---
id: reclaimed-water-cooling
title: Cooling AI facilities with reclaimed water, not drinking water
status: seed
domain: water
secondary: community
owner:
score_water: 4
score_air: 2
score_land: 2
score_community: 3
score_feasibility: 4
score_data: 3
score_governance: 3
score_footprint: 2
---

# Cooling AI facilities with reclaimed water, not drinking water

## Problem

Evaporative cooling can consume large volumes of water. In water-stressed regions, this
competes with drinking water, farms, and ecosystems. Facilities often draw from the same
supply as households.

## Who it serves

Utilities and residents in water-stressed basins; farms and ecosystems downstream of
withdrawals. The people most exposed are those with the least ability to absorb a supply
shortfall.

## Idea

Design siting and cooling so that facilities use treated wastewater or other non-potable
sources, and minimize consumptive use. Use AI to optimize the cooling plant for water and
energy together, and to publish near-real-time water-use data to the basin authority.

## How AI is used

- Inputs: facility thermal and load data, weather, reclaimed-water supply and quality data
- Method: multi-objective control of cooling, balancing water use, energy use, and
  reclaimed-water availability; anomaly detection on water meters
- Outputs and who acts on them: plant operators receive setpoints; the basin authority receives public reports
- Human decision point: operators and the water authority approve operating limits

## Design sketch

- Data sources and owners: facility (meters, plant data), municipal wastewater utility
  (reclaimed-water supply), basin authority (permits and allocations)
- Where compute or sensing runs: control loop on site; reporting to the cloud
- Power source and when it runs: favor cooling modes that use less energy when grid carbon is high
- Water use, and its source: reclaimed or non-potable only; no new withdrawal from aquifers or
  surface water that is already allocated
- Net footprint arithmetic: reclaimed water used for cooling is water that would otherwise be
  discharged; the net effect depends on whether the discharge had downstream value. Must be
  computed per site.
- Governance: public disclosure of water use; the water authority can require a reduction if
  reclaimed supply fails
- Failure mode that hurts most: reclaimed-water quality drift causing scaling or
  biological growth, and a hidden switch to potable water. Detection: quality sensors and
  a hard-coded potable-water lockout that requires a human override.

## Pilot plan

- Scope and location: one facility in a basin with an existing reclaimed-water line
- Duration and size: 12 months
- Success metric: share of cooling water from reclaimed sources (target: 100%); water use per unit of compute
- Stop rule: any potable draw not approved; reclaimed-water quality outside the agreed range for more than a set number of days
- Partners needed: facility operator, wastewater utility, basin authority

## Open questions

- Which water-stressed regions have both AI facility demand and an available reclaimed-water supply? (agenda item 2)
- Does the cooling design chosen by the facility allow low-water operation, or does it lock in consumption?

## Sources

- To add: basin water allocation records; facility water permits; wastewater reuse standards for the jurisdiction

## Review log

| Date | Event | Score or status change | Notes |
|------|-------|------------------------|-------|
| — | Seed captured | — | Footprint scored 2 until per-site arithmetic exists |
