---
id: methane-detection
title: Satellite and aerial methane detection for leaks at oil, gas, and landfill sites
status: seed
domain: air
secondary: land
owner:
score_water: 1
score_air: 5
score_land: 3
score_community: 3
score_feasibility: 4
score_data: 4
score_governance: 4
score_footprint: 4
---

# Satellite and aerial methane detection for leaks at oil, gas, and landfill sites

## Problem

Methane is a potent greenhouse gas and a local air pollutant. Leaks from oil and gas
infrastructure and landfills are often found late, and reporting relies on self-disclosure
or periodic inspection.

## Who it serves

Nearby residents exposed to leaks; regulators who need evidence to act; the climate, since
methane reductions have a near-term effect.

## Idea

Use satellite and aerial imagery, with AI detection models, to screen large areas for methane
plumes. Route candidate detections to regulators and operators for ground verification, and
publish a public, auditable record of detections and fixes.

## How AI is used

- Inputs: multispectral and hyperspectral satellite data; aerial survey imagery; facility locations
- Method: plume detection and quantification models; false positive filtering using known
  sources and weather
- Outputs and who acts on them: regulators receive candidate sites; operators receive
  verification requests; the public receives a summarized record
- Human decision point: inspectors verify each candidate before enforcement

## Design sketch

- Data sources and owners: public satellite programs, commercial imagery (licensed), regulatory
  facility registries
- Where compute or sensing runs: cloud processing is appropriate; image data is not sensitive
- Power source and when it runs: batch processing; footprint is modest
- Water use, and its source: none
- Net footprint arithmetic: processing energy is small compared with avoided methane. Quantify
  per program using leak volumes recovered.
- Governance: a public, auditable detection record; operators have a right to respond before
  publication; detection thresholds and methods are disclosed
- Failure mode that hurts most: false accusations against an operator. Detection: ground
  verification before any public naming; published false-positive rate.

## Pilot plan

- Scope and location: one basin with a known cluster of oil, gas, or landfill sites
- Duration and size: 12 months of repeat surveys
- Success metric: share of candidate detections confirmed on the ground; leaks repaired within an agreed time
- Stop rule: confirmation rate below an agreed threshold after the first survey cycle
- Partners needed: state or regional air agency, a university or research lab, a local government

## Open questions

- What is the minimum detectable emission rate for the chosen satellite data, and does it
  cover the leaks that matter? (agenda item 7)
- What legal standing do public detection records have in the jurisdiction?

## Sources

- To add: published detection validation studies; agency leak detection and repair rules

## Review log

| Date | Event | Score or status change | Notes |
|------|-------|------------------------|-------|
| — | Seed captured | — | Air impact is high; confirmation workflow is the key design risk |
