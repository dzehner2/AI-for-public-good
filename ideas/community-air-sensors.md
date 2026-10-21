---
id: community-air-sensors
title: Community-run air sensor network with calibrated, open data
status: seed
domain: air
secondary: community
owner:
score_water: 1
score_air: 4
score_land: 1
score_community: 5
score_feasibility: 4
score_data: 3
score_governance: 4
score_footprint: 4
---

# Community-run air sensor network with calibrated, open data

## Problem

Regulatory air monitors are sparse. Neighborhoods near highways, ports, industrial sites, and
landfills often have no local data, so residents cannot see exposure or verify complaints.

## Who it serves

Residents of neighborhoods with few regulatory monitors, especially those near pollution
sources. Community groups and local health departments who need evidence.

## Idea

Support community groups to host low-cost air sensors (particulate matter, NO2, ozone where
validated). Use AI to calibrate sensors against nearby regulatory monitors, flag drift and
local pollution episodes, and publish results in plain language with clear uncertainty.

## How AI is used

- Inputs: sensor readings, regulatory monitor data, meteorology, traffic and industrial activity data
- Method: co-location calibration models; drift detection; episode detection and source hints
- Outputs and who acts on them: residents and groups see dashboards and alerts; health
  departments receive validated summaries
- Human decision point: the community group decides what to publish; regulators decide enforcement

## Design sketch

- Data sources and owners: community group (sensors and host sites), regulatory agency (reference monitors)
- Where compute or sensing runs: sensors report to a community-controlled server; calibration can run locally
- Power source and when it runs: low-power devices; solar where mains are unavailable
- Water use, and its source: none
- Net footprint arithmetic: sensor and modeling energy is small; the question is whether the
  data changes decisions. Track this with a use log.
- Governance: community owns the data; publication rules are set by the group; no use of
  sensor data against individuals
- Failure mode that hurts most: overconfident claims from uncalibrated sensors. Detection:
  mandatory co-location checks and uncertainty labels on every public figure.

## Pilot plan

- Scope and location: two neighborhoods, one near a pollution source and one control
- Duration and size: 12 months; 6 to 10 sensors per neighborhood
- Success metric: agreement with reference monitors within a validated tolerance; number of
  documented decisions influenced (permits, health advisories, school policies)
- Stop rule: calibration agreement that fails for two consecutive quarters
- Partners needed: a community organization, local health department, regulatory monitor operator

## Open questions

- Which sensor models meet the agreement threshold under local conditions? (agenda item 6)
- What data-sharing terms does the health department require?

## Sources

- To add: local monitoring network reports; sensor co-location studies

## Review log

| Date | Event | Score or status change | Notes |
|------|-------|------------------------|-------|
| — | Seed captured | — | Strong community fit; calibration is the main risk |
