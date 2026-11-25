// My skills profile: self-rated proficiency for every skill, course progress, and an overall level.
import { SKILLS } from "./skills/index.js";
import { LEVELS, overallLevel, getClient, onUser, loadProgress, saveProgress, loadName } from "./progress.js";

const $ = id => document.getElementById(id);
const FILTERS = ["All", "Rated", "In progress", "Completed", "Not started"];
const state = { sb: null, user: null, progress: new Map(), filter: "All", query: "" };

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
    $("who").textContent = name ? name : "Your profile";
    setNotice("");
  } catch {
    setNotice("Couldn't load your profile. Try again in a moment.");
  }
  renderSummary();
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
