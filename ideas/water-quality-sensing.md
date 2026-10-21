---
id: water-quality-sensing
title: Low-cost water quality sensing with AI anomaly detection
status: seed
domain: water
secondary: community
owner:
score_water: 4
score_air: 1
score_land: 2
score_community: 4
score_feasibility: 3
score_data: 2
score_governance: 4
score_footprint: 4
---

# Low-cost water quality sensing with AI anomaly detection

## Problem

Many drinking water systems and rivers are tested infrequently. Contamination events, such as
a sewage overflow or a chemical release, can go undetected for days. Lab testing is slow and
expensive, and gaps are largest in small and rural systems.

## Who it serves

Residents on small or rural water systems and communities near rivers and wells that receive
runoff or discharges. The benefit is greatest where testing is least frequent.

## Idea

Deploy a network of low-cost sensors (turbidity, conductivity, pH, dissolved oxygen, and
other parameters validated for the use) in distribution systems and source waters. Use AI
to flag anomalies early, separate sensor drift from real events, and route alerts to
operators with a recommended check.

## How AI is used

- Inputs: time-series readings from sensors; lab results for calibration; weather and
  upstream rainfall
- Method: anomaly detection that accounts for normal daily and seasonal patterns; drift
  correction against lab samples
- Outputs and who acts on them: operators receive alerts with confidence and a suggested
  lab test; no automatic shutoff in the first phase
- Human decision point: operators decide on boil notices, shutoffs, and public communication

## Design sketch

- Data sources and owners: utility operator (distribution data), community or watershed
  group (source water data), accredited lab (reference measurements)
- Where compute or sensing runs: sensors and local anomaly screening on an edge device so
  alerts work without the internet; model updates in the cloud
- Power source and when it runs: low-power sensors with solar or battery where needed
- Water use, and its source: none
- Net footprint arithmetic: sensing and modeling use very little energy relative to the
  value of early detection; confirm per deployment
- Governance: data shared with the public in plain language; sensor data is not used for
  enforcement without the utility's standard process
- Failure mode that hurts most: false reassurance from a drifting sensor. Detection:
  scheduled lab comparison and a rule that any alert-free period longer than X days triggers a manual test.

## Pilot plan

- Scope and location: one small utility or one river reach with an existing lab program
- Duration and size: 12 months; 5 to 10 sensor nodes
- Success metric: detection of at least the events logged by the lab program, earlier than
  the lab program; false alarm rate below an agreed level
- Stop rule: false alarm rate that operators cannot manage; missed events confirmed by lab
- Partners needed: water utility, state or regional lab, watershed group

## Open questions

- Which parameters can low-cost sensors measure with lab-comparable accuracy? (agenda item 5)
- Who maintains sensors over time, and who pays?

## Sources

- To add: utility consumer confidence reports; sensor validation studies

## Review log

| Date | Event | Score or status change | Notes |
|------|-------|------------------------|-------|
| — | Seed captured | — | Data score low until a utility partner is identified |
