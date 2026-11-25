// Checks the Useful Skills course data: 100 skills, unique ids, every DiSSS part present,
// known categories, and the right numbering. Run: node scripts/check-skills.mjs
import { SKILLS, CATEGORIES, GENERIC_STAKES } from "../site/assets/skills/index.js";
import { VIDEOS } from "../site/assets/skills/videos.js";

const problems = [];
if (SKILLS.length !== 100) problems.push(`expected 100 skills, found ${SKILLS.length}`);
const ids = new Set();
SKILLS.forEach((s, i) => {
  if (s.n !== i + 1) problems.push(`skill at position ${i + 1} is numbered ${s.n}`);
  if (!/^[a-z0-9-]+$/.test(s.id)) problems.push(`bad id: ${s.id}`);
  if (ids.has(s.id)) problems.push(`duplicate id: ${s.id}`);
  ids.add(s.id);
  if (!CATEGORIES.includes(s.cat) || s.cat === "All") problems.push(`${s.id}: unknown category ${s.cat}`);
  for (const [key, min] of [["d", 3], ["s", 2], ["q", 3], ["k", 2]]) {
    if (!Array.isArray(s[key]) || s[key].length < min) problems.push(`${s.id}: needs at least ${min} items in ${key}`);
    else if (s[key].some(t => typeof t !== "string" || !t.trim())) problems.push(`${s.id}: empty text in ${key}`);
  }
  if (!s.name || !s.time) problems.push(`${s.id}: missing name or time`);
  if (s.safety !== undefined && (typeof s.safety !== "string" || s.safety.length < 20)) problems.push(`${s.id}: safety note too short`);
  const text = JSON.stringify(s);
  if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text)) problems.push(`${s.id}: contains an email address`);
});
for (const s of SKILLS) {
  const v = VIDEOS[s.id];
  if (!v || !v.q) { problems.push(`${s.id}: no video search entry`); continue; }
  for (const item of v.list) {
    if (!/^[A-Za-z0-9_-]{11}$/.test(item.v)) problems.push(`${s.id}: bad YouTube id ${item.v}`);
    if (!item.title || !item.channel) problems.push(`${s.id}: video missing title or channel`);
  }
}
if (GENERIC_STAKES.length < 3) problems.push("need at least 3 generic stakes");
const firstAid = SKILLS.filter(s => s.cat === "First aid");
for (const s of firstAid) if (!s.safety) problems.push(`${s.id}: first aid course without a safety note`);

console.log(`${SKILLS.length} skills, ${SKILLS.filter(s => s.safety).length} with safety notes, ${new Set(SKILLS.map(s => s.cat)).size} categories, ${Object.values(VIDEOS).reduce((n, v) => n + v.list.length, 0)} videos`);
if (problems.length) { console.log(problems.join("\n")); process.exit(1); }
console.log("All skill checks passed.");

// ---------- Skill tree and interview data ----------
const tree = await import("../site/assets/skills/tree.js");
const treeProblems = [];
const placed = new Map();
for (const b of tree.BRANCHES) b.tiers.forEach((t, i) => t.forEach(id => {
  if (placed.has(id)) treeProblems.push(`${id} is in the tree twice`);
  placed.set(id, { branch: b.id, tier: i + 1 });
}));
for (const s of SKILLS) if (!placed.has(s.id)) treeProblems.push(`${s.id} is missing from the tree`);
for (const id of placed.keys()) if (!ids.has(id)) treeProblems.push(`tree has unknown skill ${id}`);
for (const [id, reqs] of Object.entries(tree.REQUIRES)) {
  if (!ids.has(id)) treeProblems.push(`REQUIRES has unknown skill ${id}`);
  for (const r of reqs) {
    if (!ids.has(r)) treeProblems.push(`${id} requires unknown ${r}`);
    const a = placed.get(id), b = placed.get(r);
    if (a && b && a.branch === b.branch && b.tier >= a.tier) treeProblems.push(`${id} requires ${r} from the same or a later tier`);
  }
}
const visiting = new Set(), visited = new Set();
function visit(id, path) {
  if (visiting.has(id)) { treeProblems.push("prerequisite loop: " + [...path, id].join(" -> ")); return; }
  if (visited.has(id)) return;
  visiting.add(id);
  for (const r of tree.REQUIRES[id] || []) visit(r, [...path, id]);
  visiting.delete(id); visited.add(id);
}
for (const id of Object.keys(tree.REQUIRES)) visit(id, []);
for (const group of [tree.LIFE_STAGES, tree.GOALS, tree.SKIP_OPTIONS])
  for (const g of group) for (const id of g.skills) if (!ids.has(id)) treeProblems.push(`${g.id} lists unknown skill ${id}`);
for (const id of tree.ADULT_ONLY) if (!ids.has(id)) treeProblems.push(`ADULT_ONLY lists unknown skill ${id}`);
for (const [band, list] of Object.entries(tree.AGE_NUDGE)) for (const id of list) if (!ids.has(id)) treeProblems.push(`AGE_NUDGE ${band} lists unknown ${id}`);
console.log(`${tree.BRANCHES.length} branches, ${Object.keys(tree.REQUIRES).length} prerequisite links`);
if (treeProblems.length) { console.log(treeProblems.join("\n")); process.exit(1); }
console.log("Skill tree checks passed.");
