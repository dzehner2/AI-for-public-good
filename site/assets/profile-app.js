// My skills profile: self-rated proficiency for every skill, course progress, and an overall level.
import { SKILLS } from "./skills/index.js";
import { LEVELS, overallLevel, getClient, onUser, loadProgress, saveProgress, loadName, loadInterview, saveInterview } from "./progress.js";
import { BRANCHES, AGE_BANDS, LIFE_STAGES, GOALS, WEEKLY_TIME, SKIP_OPTIONS, REQUIRES } from "./skills/tree.js";
import { recommend, nodeState, skippedSet, branchRank, branchOf, missingPrereqs } from "./recommend.js";

const $ = id => document.getElementById(id);
const FILTERS = ["All", "Rated", "In progress", "Completed", "Not started"];
const state = { sb: null, user: null, progress: new Map(), interview: null, editingInterview: false, filter: "All", query: "" };
const SKILL_BY_ID = new Map(SKILLS.map(s => [s.id, s]));

function el(tag, attrs, children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value === false || value == null) continue;
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key === "on") for (const [ev, fn] of Object.entries(value)) node.addEventListener(ev, fn);
    else node.setAttribute(key, value === true ? "" : value);
  }
  for (const child of children || []) {
    if (child == null || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

function setNotice(message) {
  $("notice").textContent = message || "";
  $("notice").hidden = !message;
}

function rowFor(id) {
  return state.progress.get(id) || { skill_id: id, level: 0, steps_done: [], completed_at: null };
}

function status(skill, row) {
  if (row.completed_at) return "completed";
  if (row.steps_done.length) return "in progress";
  return "not started";
}

function renderSummary() {
  const rows = [...state.progress.values()];
  const completed = rows.filter(r => r.completed_at).length;
  const inProgress = rows.filter(r => !r.completed_at && r.steps_done.length).length;
  const rated = rows.filter(r => r.level > 0).length;
  const teach = rows.filter(r => r.level === 4).length;
  const lvl = overallLevel(completed);
  $("level-title").textContent = `Level ${lvl.level}: ${lvl.title}`;
  $("level-fill").style.width = Math.round((lvl.into / lvl.need) * 100) + "%";
  $("level-meter").setAttribute("aria-valuemax", String(lvl.need));
  $("level-meter").setAttribute("aria-valuenow", String(lvl.into));
  const left = lvl.need - lvl.into;
  $("level-next").textContent = `Complete ${left} more course${left === 1 ? "" : "s"} to reach Level ${lvl.level + 1}.`;
  $("stat-completed").textContent = completed;
  $("stat-progress").textContent = inProgress;
  $("stat-rated").textContent = rated;
  $("stat-teach").textContent = teach;
  $("teach-hint").hidden = teach === 0;
}

// ---------- Interview ----------

function choiceGroup(name, legend, options, type, selected, hint) {
  const fs = el("fieldset", { class: "choices" }, [el("legend", { text: legend })]);
  if (hint) fs.append(el("p", { class: "note", text: hint }));
  const wrap = el("div", { class: "choice-grid" });
  for (const opt of options) {
    const id = `${name}-${opt.id}`;
    wrap.append(el("label", { class: "choice", for: id }, [
      el("input", { type, name, id, value: opt.id, checked: selected.includes(opt.id) }),
      el("span", { text: opt.label })
    ]));
  }
  fs.append(wrap);
  return fs;
}

function labelsFor(list, ids) {
  return list.filter(o => ids.includes(o.id)).map(o => o.label);
}

function renderInterview() {
  const body = $("interview-body");
  body.replaceChildren();
  const iv = state.interview;
  if (iv && !state.editingInterview) {
    const age = AGE_BANDS.find(a => a.id === iv.age_band);
    const time = WEEKLY_TIME.find(t => t.id === iv.weekly_time);
    body.append(
      el("dl", { class: "answers" }, [
        el("dt", { text: "Age" }), el("dd", { text: age ? age.label : "Not given" }),
        el("dt", { text: "Life stage" }), el("dd", { text: labelsFor(LIFE_STAGES, iv.life_stages || []).join(", ") || "Not given" }),
        el("dt", { text: "Goals" }), el("dd", { text: labelsFor(GOALS, iv.goals || []).join(", ") || "Not given" }),
        el("dt", { text: "Time each week" }), el("dd", { text: time ? time.label : "Not given" }),
        el("dt", { text: "Skipping" }), el("dd", { text: labelsFor(SKIP_OPTIONS, iv.skip || []).join(", ") || "Nothing" })
      ]),
      el("button", { type: "button", class: "secondary", id: "edit-interview", text: "Change my answers",
        on: { click: () => { state.editingInterview = true; renderInterview(); } } })
    );
    return;
  }
  const current = iv || { age_band: null, life_stages: [], goals: [], weekly_time: null, skip: [] };
  const status = el("p", { class: "status", "aria-live": "polite" });
  const form = el("form", { id: "interview-form" }, [
    el("p", { text: "Five quick questions so we can suggest what to learn next. Your answers are private and you can change them any time." }),
    choiceGroup("age", "1. How old are you?", AGE_BANDS, "radio", current.age_band ? [current.age_band] : [], "We only store your age range."),
    choiceGroup("stage", "2. Which of these describe your life right now?", LIFE_STAGES, "checkbox", current.life_stages || [], "Pick any that apply."),
    choiceGroup("goal", "3. What do you want skills to help you do?", GOALS, "checkbox", current.goals || [], "Pick up to three for the sharpest suggestions."),
    choiceGroup("time", "4. How much time can you give each week?", WEEKLY_TIME, "radio", current.weekly_time ? [current.weekly_time] : []),
    choiceGroup("skip", "5. Anything you'd rather we didn't suggest?", SKIP_OPTIONS, "checkbox", current.skip || [], "Optional. Those courses stay on the site; we just won't suggest them."),
    el("div", { class: "actions" }, [
      el("button", { type: "submit", class: "primary", id: "save-interview", text: "Save and suggest courses" }),
      iv ? el("button", { type: "button", class: "secondary", text: "Cancel", on: { click: () => { state.editingInterview = false; renderInterview(); } } }) : null
    ]),
    status
  ]);
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const pick = name => [...form.querySelectorAll(`input[name="${name}"]:checked`)].map(i => i.value);
    const answers = { age_band: pick("age")[0] || null, life_stages: pick("stage"), goals: pick("goal"), weekly_time: pick("time")[0] || null, skip: pick("skip") };
    if (!answers.age_band) { status.textContent = "Please choose your age range."; return; }
    if (!answers.goals.length) { status.textContent = "Please choose at least one goal."; return; }
    try {
      state.interview = await saveInterview(state.sb, state.user.id, answers);
      state.editingInterview = false;
      renderInterview(); renderRecommendations(); renderTree();
      $("next-up").scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      status.textContent = "Couldn't save your answers. Try again.";
    }
  });
  body.append(form);
}

// ---------- What to learn next ----------

function renderRecommendations() {
  const box = $("recommendations");
  box.replaceChildren();
  if (!state.interview) {
    box.append(el("p", { class: "empty", text: "Answer the questions above and we'll suggest courses that fit you." }));
    return;
  }
  const recs = recommend(SKILLS, state.interview, state.progress, 3);
  if (!recs.length) {
    box.append(el("p", { class: "empty", text: "You've covered everything that matches your answers. Try adding a goal, or explore the tree below." }));
    return;
  }
  recs.forEach((r, i) => {
    const where = branchOf(r.skill.id);
    box.append(el("article", { class: "rec" + (i === 0 ? " top" : "") }, [
      el("p", { class: "domain", text: (where ? `${where.branch.icon} ${where.branch.name} · Tier ${where.tier}` : r.skill.cat) + (i === 0 ? " · Best next step" : "") }),
      el("h3", {}, [el("a", { href: "skills.html#skill-" + r.skill.id, text: r.skill.name })]),
      el("ul", { class: "reasons" }, r.reasons.slice(0, 4).map(t => el("li", { text: t }))),
      el("p", { class: "summary", text: "Time to learn: " + r.skill.time }),
      el("a", { class: "button-link", href: "skills.html#skill-" + r.skill.id, text: r.locked ? "Preview the course" : "Start this course" })
    ]));
  });
}

// ---------- Skill tree ----------

const STATE_TEXT = { done: "Completed", progress: "In progress", available: "Ready to learn", locked: "Locked", skipped: "Not suggested for you" };
const ROMAN = ["I", "II", "III", "IV", "V"];

function pips(level) {
  return el("span", { class: "pips", "aria-hidden": "true" }, LEVELS.slice(1).map((_, i) => el("span", { class: i < level ? "pip on" : "pip" })));
}

function renderTree() {
  const tree = $("skill-tree");
  tree.replaceChildren();
  const skipped = skippedSet(state.interview);
  const nextIds = new Set(recommend(SKILLS, state.interview, state.progress, 3).map(r => r.skill.id));
  for (const branch of BRANCHES) {
    const rank = branchRank(state.progress, branch);
    const card = el("section", { class: "branch", "data-branch": branch.id, "aria-label": `${branch.name} branch` }, [
      el("header", { class: "branch-head" }, [
        el("span", { class: "branch-icon", "aria-hidden": "true", text: branch.icon }),
        el("span", { class: "branch-title" }, [el("strong", { text: branch.name }), el("span", { class: "branch-rank", text: `${rank.title} · ${rank.done}/${rank.total}` })])
      ]),
      el("div", { class: "meter small", role: "progressbar", "aria-label": `${branch.name} progress`, "aria-valuemin": "0", "aria-valuemax": String(rank.total), "aria-valuenow": String(rank.done) },
        [el("span", { style: `width:${Math.round((rank.done / rank.total) * 100)}%` })]),
      el("p", { class: "branch-blurb", text: branch.blurb })
    ]);
    branch.tiers.forEach((tier, ti) => {
      const row = el("div", { class: "tier" }, [el("span", { class: "tier-label", text: "Tier " + ROMAN[ti] })]);
      const nodes = el("div", { class: "tier-nodes" });
      for (const id of tier) {
        const skill = SKILL_BY_ID.get(id);
        const st = nodeState(state.progress, id, skipped);
        const prog = state.progress.get(id);
        const level = prog ? prog.level : 0;
        const missing = missingPrereqs(state.progress, id).map(m => SKILL_BY_ID.get(m).name);
        const detail = st === "locked" ? "Learn first: " + missing.join(", ") : STATE_TEXT[st] + (level ? ` · ${LEVELS[level]}` : "");
        nodes.append(el("a", { class: `node ${st}` + (nextIds.has(id) ? " next" : ""), href: "skills.html#skill-" + id,
          title: detail, "data-skill": id, "aria-label": `${skill.name}: ${detail}` }, [
          el("span", { class: "node-name", text: (st === "locked" ? "🔒 " : st === "done" ? "★ " : "") + skill.name }),
          pips(level),
          nextIds.has(id) ? el("span", { class: "node-tag", text: "Suggested" }) : null
        ]));
      }
      row.append(nodes);
      card.append(row);
    });
    tree.append(card);
  }
}

function renderFilters() {
  const box = $("profile-filters");
  box.replaceChildren();
  for (const f of FILTERS) {
    box.append(el("button", { type: "button", class: "chip", "aria-pressed": String(state.filter === f), text: f,
      on: { click: () => { state.filter = f; renderList(); } } }));
  }
}

function matches(skill, row) {
  const st = status(skill, row);
  if (state.filter === "Rated" && row.level === 0) return false;
  if (state.filter === "In progress" && st !== "in progress") return false;
  if (state.filter === "Completed" && st !== "completed") return false;
  if (state.filter === "Not started" && st !== "not started") return false;
  if (state.query && !skill.name.toLowerCase().includes(state.query.toLowerCase())) return false;
  return true;
}

async function setLevel(skill, value, statusEl) {
  const row = { ...rowFor(skill.id), level: value };
  try {
    await saveProgress(state.sb, state.user.id, skill.id, row);
    state.progress.set(skill.id, row);
    statusEl.textContent = "Saved";
    renderSummary();
    renderRecommendations();
    renderTree();
  } catch {
    statusEl.textContent = "Couldn't save. Try again.";
  }
}

function renderList() {
  renderFilters();
  const list = $("profile-list");
  list.replaceChildren();
  const shown = SKILLS.filter(s => matches(s, rowFor(s.id)));
  $("profile-count").textContent = `${shown.length} of ${SKILLS.length} skills`;
  if (!shown.length) list.append(el("p", { class: "empty", text: "Nothing here yet." }));
  for (const skill of shown) {
    const row = rowFor(skill.id);
    const saved = el("span", { class: "saved", "aria-live": "polite" });
    const select = el("select", { "aria-label": "Your level in " + skill.name, id: "level-" + skill.id,
      on: { change: e => setLevel(skill, Number(e.target.value), saved) } },
      LEVELS.map((label, i) => el("option", { value: String(i), text: label, selected: row.level === i })));
    const st = status(skill, row);
    const progressText = st === "completed"
      ? el("span", { class: "done", text: "Course completed " + new Date(row.completed_at).toLocaleDateString() })
      : el("span", { text: st === "in progress" ? `${row.steps_done.length} of ${skill.q.length} steps done` : "Course not started" });
    list.append(el("div", { class: "skill-row", "data-skill": skill.id }, [
      el("span", { class: "name" }, [el("a", { href: "skills.html#skill-" + skill.id, text: skill.name })]),
      select,
      el("span", { class: "meta" }, [el("span", { text: skill.cat }), progressText, saved])
    ]));
  }
}

function showSignedOut() {
  $("signed-out").hidden = false;
  $("signed-in").hidden = true;
}

async function showSignedIn() {
  $("signed-out").hidden = true;
  $("signed-in").hidden = false;
  try {
    const [progress, name] = await Promise.all([loadProgress(state.sb), loadName(state.sb, state.user.id)]);
    state.progress = progress;
    try { state.interview = await loadInterview(state.sb); } catch { state.interview = null; }
    state.editingInterview = false;
    $("who").textContent = name ? name : "Your profile";
    setNotice("");
  } catch {
    setNotice("Couldn't load your profile. Try again in a moment.");
  }
  renderSummary();
  renderInterview();
  renderRecommendations();
  renderTree();
  renderList();
}

function bindSignIn() {
  const status = $("auth-status");
  const redirectTo = location.origin + location.pathname;
  $("send-link").addEventListener("click", async () => {
    const email = $("auth-email").value.trim();
    if (!/[^@\s]+@[^@\s]+\.[^@\s]+/.test(email)) { status.textContent = "Enter an email address."; return; }
    status.textContent = "Sending…";
    const { error } = await state.sb.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
    status.textContent = error ? "Could not send the link. Try again in a minute." : "Check your email for a sign-in link.";
  });
  $("google").addEventListener("click", async () => {
    const { error } = await state.sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
    if (error) status.textContent = "Google sign-in is not available right now.";
  });
  $("sign-out").addEventListener("click", () => state.sb.auth.signOut());
}

function start() {
  state.sb = getClient();
  if (!state.sb) {
    setNotice("The database is not configured for this copy of the site, so profiles are unavailable.");
    return;
  }
  bindSignIn();
  $("profile-search").addEventListener("input", e => { state.query = e.target.value.trim(); renderList(); });
  onUser(state.sb, user => {
    state.user = user;
    if (user) showSignedIn(); else showSignedOut();
  });
}

start();
