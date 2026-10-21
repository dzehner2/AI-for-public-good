---
id: waste-heat-reuse
title: Data center waste heat for district heating and greenhouses
status: seed
domain: community
secondary: air
owner:
score_water: 2
score_air: 4
score_land: 2
score_community: 4
score_feasibility: 3
score_data: 3
score_governance: 4
score_footprint: 3
---

# Data center waste heat for district heating and greenhouses

## Problem

Data centers reject large amounts of heat. Many nearby homes, schools, and food growers
burn gas or oil for heat. Waste heat that goes unused is lost energy and a missed chance
to cut local combustion emissions.

## Who it serves

Households and public buildings on a heat network near a data center, and local growers who
can use low-grade heat year-round. The cost risk falls on ratepayers if the heat network is
built for one private site, so a public or cooperative operator is preferred.

## Idea

Connect a data center's heat output to a district heating loop or a greenhouse cluster.
Use AI to forecast heat supply against demand so the compute schedule and heat delivery are
planned together, and to detect loop leaks and temperature faults.

## How AI is used

- Inputs: facility load telemetry, weather, building heat demand profiles
- Method: short-term heat supply and demand forecasting; fault detection on the loop
- Outputs and who acts on them: the heat network operator schedules pumps and plant; the
  facility operator adjusts workload timing
- Human decision point: the network operator approves setpoints and any change to service

## Design sketch

- Data sources and owners: facility operator (telemetry, under contract), municipal or
  utility heat network (demand data), weather service
- Where compute or sensing runs: cloud forecasting is acceptable; loop controls must run
  locally so heat supply continues during an outage
- Power source and when it runs: heat recovery is a byproduct of existing compute, so the
  case is strongest where the facility already runs in the cold season
- Water use, and its source: none added; heat exchangers are closed-loop
- Net footprint arithmetic: the AI forecasting load is small compared with recovered
  heat. Quantify this for each site before committing.
- Governance: heat tariff set by the public utility or a cooperative, with a fixed
  supply obligation and transparent pricing; data sharing limited to what forecasting needs
- Failure mode that hurts most: heat service loss in winter. Detection: local controller
  with a backup boiler interlock, tested monthly.

## Pilot plan

- Scope and location: one data center within 1 km of a public building cluster or greenhouse
- Duration and size: 12 months, one heat exchanger loop
- Success metric: share of recovered heat delivered to end use; forecast error on daily heat demand
- Stop rule: service interruptions above the agreed threshold, or no signed heat offtake
- Partners needed: facility operator, heat network operator or municipality, a local growers' co-op

## Open questions

- Is there a heat network within reach of any target facility, or does one need building?
- What is the realistic heat temperature after the facility's cooling loop, and does it suit the end use?

## Sources

- To add: regulatory filings for target facilities; heat network design standards for the jurisdiction

## Review log

| Date | Event | Score or status change | Notes |
|------|-------|------------------------|-------|
| — | Seed captured | — | Scores are preliminary judgments |
