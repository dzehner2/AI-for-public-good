// Skill tree states, branch ranks, and "what to learn next" suggestions.
// Pure functions: no network, so they can be tested on their own.
import { BRANCHES, REQUIRES, LIFE_STAGES, GOALS, SKIP_OPTIONS, ADULT_ONLY, AGE_NUDGE } from "./skills/tree.js";

export const PRACTISING = 2;

function rowOf(progress, id) {
  return progress.get(id) || { level: 0, steps_done: [], completed_at: null };
}

// A prerequisite is met by completing its course or rating yourself Practising or higher.
export function prereqMet(progress, id) {
  const row = rowOf(progress, id);
  return !!row.completed_at || row.level >= PRACTISING;
}

export function missingPrereqs(progress, id) {
  return (REQUIRES[id] || []).filter(req => !prereqMet(progress, req));
}

export function skippedSet(interview) {
  const out = new Set();
  if (!interview) return out;
  for (const opt of SKIP_OPTIONS) if ((interview.skip || []).includes(opt.id)) opt.skills.forEach(s => out.add(s));
  if (interview.age_band === "13-17") ADULT_ONLY.forEach(s => out.add(s));
  return out;
}

export function nodeState(progress, id, skipped) {
  const row = rowOf(progress, id);
  if (row.completed_at) return "done";
  if (row.steps_done.length) return "progress";
  if (skipped && skipped.has(id)) return "skipped";
  if (missingPrereqs(progress, id).length) return "locked";
  return "available";
}

const RANKS = [[1, "Master"], [0.75, "Expert"], [0.4, "Adept"], [0.0001, "Novice"], [0, "Untrained"]];

export function branchRank(progress, branch) {
  const ids = branch.tiers.flat();
  const done = ids.filter(id => rowOf(progress, id).completed_at).length;
  const ratio = done / ids.length;
  const title = RANKS.find(([min]) => ratio >= min)[1];
  return { done, total: ids.length, title };
}

export function branchOf(id) {
  for (const b of BRANCHES) {
    const tier = b.tiers.findIndex(t => t.includes(id));
    if (tier >= 0) return { branch: b, tier: tier + 1 };
  }
  return null;
}

const QUICK = /minute|hour|1 session|1 day|1 evening|1 week|afternoon|weekend|meal|snowfall|dinners|cookouts|2 sessions|3 sessions|outings/i;
const LONG = /season|course|month|class|lesson|6 weeks|8 weeks|4 weeks/i;

// Unlocks: skills this one is a prerequisite for.
function unlocksOf(id) {
  return Object.entries(REQUIRES).filter(([, reqs]) => reqs.includes(id)).map(([s]) => s);
}

export function recommend(skills, interview, progress, count = 3) {
  if (!interview) return [];
  const skipped = skippedSet(interview);
  const goals = GOALS.filter(g => (interview.goals || []).includes(g.id));
  const stages = LIFE_STAGES.filter(s => (interview.life_stages || []).includes(s.id));
  const nudge = new Set(AGE_NUDGE[interview.age_band] || []);
  const lowTime = interview.weekly_time === "1h";
  const byId = new Map(skills.map(s => [s.id, s]));
  const scored = [];
  for (const skill of skills) {
    const row = rowOf(progress, skill.id);
    if (row.completed_at || skipped.has(skill.id)) continue;
    if (row.level >= 3 && !row.steps_done.length) continue;   // already confident, nothing to push
    const reasons = [];
    let score = 0;
    const goalHits = goals.filter(g => g.skills.includes(skill.id));
    const stageHits = stages.filter(s => s.skills.includes(skill.id));
    score += goalHits.length * 3 + stageHits.length * 2;
    if (goalHits.length) reasons.push("Fits your goal" + (goalHits.length > 1 ? "s" : "") + ": " + goalHits.map(g => g.label.toLowerCase()).join(", "));
    if (stageHits.length) reasons.push("Useful for: " + stageHits.map(s => s.label.toLowerCase()).join(", "));
    if (nudge.has(skill.id)) { score += 1; reasons.push("A good fit for your age range"); }
    if (row.steps_done.length) { score += 4; reasons.unshift(`You've started this: ${row.steps_done.length} of ${skill.q.length} steps done`); }
    const missing = missingPrereqs(progress, skill.id);
    if (missing.length) score -= 3; else score += 2;
    const where = branchOf(skill.id);
    if (where && where.tier === 1) score += 1;
    const caresForOthers = (interview.goals || []).some(g => g === "family" || g === "emergencies") ||
      (interview.life_stages || []).some(s => ["new-parent", "parent-kids", "caregiver"].includes(s));
    if (where && where.branch.id === "medic" && caresForOthers) { score += 2; reasons.push("A lifesaving skill"); }
    if (lowTime && QUICK.test(skill.time)) { score += 1; reasons.push("Quick to learn: " + skill.time); }
    if (lowTime && LONG.test(skill.time)) score -= 2;
    const unlocks = unlocksOf(skill.id).filter(id => !skipped.has(id) && byId.has(id));
    if (unlocks.length && !missing.length) reasons.push("Unlocks " + unlocks.map(id => byId.get(id).name).join(", "));
    if (missing.length) reasons.push("Learn first: " + missing.map(id => byId.get(id).name).join(", "));
    if (!goalHits.length && !stageHits.length && !row.steps_done.length) continue;   // only suggest things that fit the answers
    scored.push({ skill, score, reasons, locked: missing.length > 0 });
  }
  scored.sort((a, b) => b.score - a.score || a.skill.n - b.skill.n);
  return scored.slice(0, count);
}
