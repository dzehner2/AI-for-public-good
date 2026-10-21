---
id: grid-aware-scheduling
title: Grid-aware compute scheduling that follows clean power
status: seed
domain: air
secondary: community
owner:
score_water: 2
score_air: 4
score_land: 2
score_community: 3
score_feasibility: 4
score_data: 4
score_governance: 4
score_footprint: 3
---

# Grid-aware compute scheduling that follows clean power

## Problem

Electricity generation is a major source of air pollution where fossil plants run at the
margin. AI workloads are often scheduled without regard to when or where the grid is dirty
or stressed. Peak demand from compute can force the grid to run the most polluting plants.

## Who it serves

Residents near fossil generation who bear local air pollution, and grid operators who need
flexible demand during stress events.

## Idea

Shift flexible AI workloads (training runs, batch inference, data processing that does not
need a fixed time) to hours and sites with clean power or low grid carbon intensity, and
pause or slow them during grid emergencies when the operator requests it.

## How AI is used

- Inputs: grid carbon intensity forecasts, renewable generation forecasts, job queue and
  deadline data, grid operator signals
- Method: constrained scheduling optimization with forecast uncertainty; a classifier to
  tag jobs by flexibility
- Outputs and who acts on them: the scheduler moves jobs; the grid operator receives
  flexibility commitments
- Human decision point: customers set deadlines and flexibility limits; the grid operator sets
  emergency terms

## Design sketch

- Data sources and owners: grid operator and carbon intensity forecasts (public or licensed);
  facility job data (operator)
- Where compute or sensing runs: scheduler in the cloud; each job keeps a checkpoint so
  pausing does not lose work
- Power source and when it runs: prefer hours of high renewable output and low carbon intensity
- Water use, and its source: unchanged; note that some cooling choices depend on time of day
- Net footprint arithmetic: scheduling itself uses little energy. The benefit depends on
  whether the shift reduces marginal fossil generation, which must be shown with
  carbon intensity data for each region.
- Governance: no hidden deprioritization of customers; flexibility tiers are disclosed;
  grid commitments are published
- Failure mode that hurts most: customer deadlines missed silently. Detection: deadline
  alarms and a hard priority class that never moves.

## Pilot plan

- Scope and location: one region with public marginal or average carbon data; one batch workload class
- Duration and size: 6 months, a fixed share of the batch queue
- Success metric: kg CO2e per compute unit versus baseline; zero missed hard deadlines
- Stop rule: any missed hard deadline, or a measured increase in emissions
- Partners needed: facility operator, grid operator or balancing authority, a large internal customer

## Open questions

- Are published carbon signals granular enough (hourly, local) to act on in the target region?
- How much of the workload is truly flexible?

## Sources

- To add: grid operator carbon intensity documentation; facility workload profiles

## Review log

| Date | Event | Score or status change | Notes |
|------|-------|------------------------|-------|
| — | Seed captured | — | Air score depends on region; not yet tested |
