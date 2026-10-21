---
id: watershed-participatory-modeling
title: Participatory watershed and soil planning with shared AI models
status: seed
domain: land
secondary: water
owner:
score_water: 4
score_air: 2
score_land: 4
score_community: 5
score_feasibility: 3
score_data: 3
score_governance: 4
score_footprint: 4
---

# Participatory watershed and soil planning with shared AI models

## Problem

Watershed and soil decisions, such as where to plant cover crops, restore wetlands, or manage
runoff, are often made by agencies or consultants with models that residents cannot inspect.
Local knowledge is seldom built into the models, and the results are hard to contest.

## Who it serves

Farmers, landowners, tribal and local governments, and downstream communities affected by
runoff and flooding.

## Idea

Give a watershed group an open, inspectable model of its basin (hydrology, soil condition,
land use, and scenarios). Let residents and farmers add local observations, test scenarios
such as cover crops or wetland restoration, and see the effects on flow, sediment, and nutrient
loads. Use AI to fill data gaps, speed up scenario runs, and explain trade-offs in plain language.

## How AI is used

- Inputs: soil and land cover data, weather, stream gauges, farm practice records (voluntary),
  local observations
- Method: a simplified, calibrated watershed model with an AI surrogate for fast scenario
  runs; data-gap imputation with uncertainty; plain-language scenario summaries
- Outputs and who acts on them: the watershed group and landowners compare practices; the
  group recommends actions to agencies
- Human decision point: the group and landowners decide; participation is voluntary

## Design sketch

- Data sources and owners: public soil and land data; gauges (agencies); farm data only with
  each landowner's consent and aggregated
- Where compute or sensing runs: a model that runs on modest hardware or a shared cloud instance
- Power source and when it runs: low load
- Water use, and its source: none
- Net footprint arithmetic: small compute load; benefit from better practice decisions. Track
  reductions in modeled nutrient and sediment loads.
- Governance: open model code and documentation; farm-level data stays with the farmer; the
  group, not the vendor, controls the model
- Failure mode that hurts most: a model that is confidently wrong about a local hazard. Detection:
  calibration against local gauges and a standing review by local experts before results are used.

## Pilot plan

- Scope and location: one sub-watershed with an active group and existing gauges
- Duration and size: 12 months; 10 to 20 participating landowners
- Success metric: number of scenarios tested by residents; model agreement with gauge data; practices adopted
- Stop rule: model disagreement with gauge data that the group cannot resolve after one calibration cycle
- Partners needed: watershed group, soil and water conservation district, a university extension program

## Open questions

- Which participatory modeling methods have worked in comparable basins? (agenda item 9)
- What incentives or cost-share programs would make practice changes feasible?

## Sources

- To add: state watershed plans; soil survey data for the basin

## Review log

| Date | Event | Score or status change | Notes |
|------|-------|------------------------|-------|
| — | Seed captured | — | Community score high; depends on an active local group |
