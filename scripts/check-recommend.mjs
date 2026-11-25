// Checks the "what to learn next" rules with sample people. Run: node scripts/check-recommend.mjs
import { SKILLS } from "../site/assets/skills/index.js";
import { recommend, nodeState, skippedSet, branchRank } from "../site/assets/recommend.js";
import { BRANCHES } from "../site/assets/skills/tree.js";

const problems = [];
const ok = (cond, msg) => { if (!cond) problems.push(msg); else console.log("PASS " + msg); };
const P = rows => new Map(Object.entries(rows).map(([k, v]) => [k, { level: 0, steps_done: [], completed_at: null, ...v }]));

const newParent = recommend(SKILLS, { age_band: "25-34", life_stages: ["new-parent"], goals: ["family"], weekly_time: "1h", skip: [] }, P({}));
ok(newParent.length === 3, "three suggestions for a new parent");
ok(newParent.some(r => ["perform-cpr", "change-a-diaper", "perform-the-heimlich-maneuver", "treat-a-burn"].includes(r.skill.id)), "new parent gets a family safety skill: " + newParent.map(r => r.skill.id).join(", "));
ok(newParent.every(r => r.reasons.length > 0), "every suggestion explains why");
ok(["perform-cpr", "treat-a-burn", "perform-the-heimlich-maneuver"].includes(newParent[0].skill.id), "a first-aid skill comes first for a new parent: " + newParent.map(r => r.skill.id).join(", "));

const teen = recommend(SKILLS, { age_band: "13-17", life_stages: ["student"], goals: ["fun", "outdoors", "cooking"], weekly_time: "5h+", skip: [] }, P({}), 100);
ok(!teen.some(r => ["properly-pour-beer", "mix-two-classic-cocktails", "shoot-a-gun", "hunt", "ride-a-motorcycle", "use-a-chainsaw-safely"].includes(r.skill.id)), "under-18s never get adult-only skills");

const noGuns = recommend(SKILLS, { age_band: "35-49", life_stages: ["rural"], goals: ["outdoors"], weekly_time: "5h+", skip: ["firearms"] }, P({}), 100);
ok(!noGuns.some(r => ["shoot-a-gun", "hunt", "field-dress-game"].includes(r.skill.id)), "skipped topics are never suggested");

const started = recommend(SKILLS, { age_band: "35-49", life_stages: [], goals: ["mind"], weekly_time: "2-4h", skip: [] }, P({ "tie-a-necktie": { steps_done: [1, 2] } }));
ok(started[0].skill.id === "tie-a-necktie", "a course you've started comes first");

const done = recommend(SKILLS, { age_band: "35-49", life_stages: ["new-parent"], goals: ["family"], weekly_time: "2-4h", skip: [] }, P({ "perform-cpr": { completed_at: "2026-11-01T00:00:00Z", level: 2 } }), 100);
ok(!done.some(r => r.skill.id === "perform-cpr"), "completed courses are not suggested again");

ok(nodeState(P({}), "make-fire-without-matches", new Set()) === "locked", "a skill with unmet prerequisites is locked");
ok(nodeState(P({ "build-a-campfire": { level: 2 } }), "make-fire-without-matches", new Set()) === "available", "rating a prerequisite Practising unlocks the next skill");
ok(nodeState(P({ "build-a-campfire": { completed_at: "2026-11-01T00:00:00Z" } }), "make-fire-without-matches", new Set()) === "available", "completing a prerequisite unlocks the next skill");
ok(skippedSet({ age_band: "13-17", skip: [] }).has("shoot-a-gun"), "adult-only skills are marked skipped for under-18s in the tree");
const survivor = BRANCHES.find(b => b.id === "survivor");
ok(branchRank(P({}), survivor).title === "Untrained", "empty branch is Untrained");
ok(branchRank(P({ "build-a-campfire": { completed_at: "x" } }), survivor).title === "Novice", "one completed skill makes a Novice");
ok(recommend(SKILLS, null, P({})).length === 0, "no suggestions before the interview");

if (problems.length) { console.log("FAIL " + problems.join("\nFAIL ")); process.exit(1); }
console.log("All recommendation checks passed.");
