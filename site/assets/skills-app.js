// Useful Skills: a list of 100 skills, a DiSSS course for each, and a stake to email to a friend.
// No sign-in and no server: the email opens in the visitor's own email app, and nothing is stored.
import { SKILLS, CATEGORIES, GENERIC_STAKES } from "./skills/index.js";
import { VIDEOS } from "./skills/videos.js";
import { LEVELS, levelAfterCompletion, overallLevel, getClient, onUser, loadProgress, saveProgress } from "./progress.js";

const SVG_NS = "http://www.w3.org/2000/svg";

const $ = id => document.getElementById(id);
const state = { filter: "All", query: "", sb: null, user: null, progress: new Map() };

function rowFor(id) {
  return state.progress.get(id) || { skill_id: id, level: 0, steps_done: [], completed_at: null };
}

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

function siteUrl(path) {
  return new URL(path, location.href).href.split("#")[0];
}

function courseUrl(skill) {
  return siteUrl("skills.html") + "#skill-" + skill.id;
}

function matches(skill) {
  if (state.filter !== "All" && skill.cat !== state.filter) return false;
  if (!state.query) return true;
  const q = state.query.toLowerCase();
  return skill.name.toLowerCase().includes(q) || skill.cat.toLowerCase().includes(q) ||
    skill.d.some(part => part.toLowerCase().includes(q));
}

// ---------- List ----------

function renderChips() {
  const chips = $("skill-chips");
  chips.replaceChildren();
  for (const cat of CATEGORIES) {
    chips.append(el("button", { type: "button", class: "chip", "aria-pressed": String(state.filter === cat), text: cat,
      on: { click: () => { state.filter = cat; renderList(); } } }));
  }
}

function renderList() {
  renderChips();
  const cards = $("skill-cards");
  cards.replaceChildren();
  const shown = SKILLS.filter(matches);
  $("skill-count").textContent = `${shown.length} of ${SKILLS.length} skills`;
  if (!shown.length) cards.append(el("p", { class: "empty", text: "No skills match. Try another word or category." }));
  for (const skill of shown) {
    cards.append(el("a", { class: "card", href: "#skill-" + skill.id }, [
      el("p", { class: "domain", text: skill.cat }),
      el("h3", {}, [el("span", { class: "num", text: skill.n + ". " }), skill.name]),
      el("p", { class: "summary", text: "Time to learn: " + skill.time }),
      skill.safety ? el("span", { class: "safety-tag", text: "Safety note: learn hands-on" }) : null,
      cardStatus(skill),
      el("span", { class: "more", text: "Open the course" })
    ]));
  }
}

// ---------- Diagram ----------

// Wrap text into lines of at most `max` characters, breaking on spaces.
function wrap(text, max) {
  const lines = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    if ((line + " " + word).trim().length > max && line) { lines.push(line); line = word; }
    else line = (line + " " + word).trim();
  }
  if (line) lines.push(line);
  return lines;
}

function svg(tag, attrs, children) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs || {})) node.setAttribute(k, v);
  for (const c of children || []) node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return node;
}

// A flowchart of the learning path: the Sequencing steps in order, ending at the stake.
// Built from the course text, so it always matches the steps above it.
function learningPathDiagram(skill) {
  const W = 360, X = 52, BOX_W = 292, LINE = 18, PAD = 10, GAP = 26, MAX = 36;
  const steps = skill.q.map((text, i) => ({ label: String(i + 1), lines: wrap(text, MAX) }));
  steps.push({ label: "★", lines: wrap("Stake: show a friend what you learned by your date.", MAX), stake: true });
  let y = 8;
  const parts = [];
  steps.forEach((st, i) => {
    const h = st.lines.length * LINE + PAD * 2;
    parts.push(svg("rect", { x: X, y, width: BOX_W, height: h, rx: 8, class: st.stake ? "dg-box dg-stake" : "dg-box" }));
    parts.push(svg("circle", { cx: 24, cy: y + h / 2, r: 15, class: st.stake ? "dg-num dg-stake-num" : "dg-num" }));
    parts.push(svg("text", { x: 24, y: y + h / 2 + 5, "text-anchor": "middle", class: "dg-num-text" }, [st.label]));
    st.lines.forEach((ln, j) => parts.push(svg("text", { x: X + 12, y: y + PAD + 13 + j * LINE, class: "dg-text" }, [ln])));
    if (i < steps.length - 1) {
      const ay = y + h;
      parts.push(svg("line", { x1: 24, y1: y + h / 2 + 15, x2: 24, y2: ay + GAP + 4, class: "dg-line" }));
      parts.push(svg("path", { d: `M ${X + BOX_W / 2 - 6} ${ay + 6} L ${X + BOX_W / 2} ${ay + GAP - 6} L ${X + BOX_W / 2 + 6} ${ay + 6}`, class: "dg-arrow" }));
    }
    y += h + GAP;
  });
  const height = y - GAP + 8;
  const label = "Learning path for " + skill.name + ": " + skill.q.map((t, i) => `step ${i + 1}, ${t}`).join("; ") + "; then set your stake.";
  const node = svg("svg", { viewBox: `0 0 ${W} ${height}`, role: "img", "aria-label": label, class: "diagram" },
    [svg("title", {}, ["Learning path: " + skill.name]), ...parts]);
  return el("figure", { class: "course-diagram" }, [node, el("figcaption", { text: "Learning path: work through the steps in order, then set your stake." })]);
}

// The parts of the skill, with the vital few from Selection listed beside them.
function partsDiagram(skill) {
  return el("figure", { class: "parts-diagram" }, [
    el("div", { class: "parts-hub", text: skill.name }),
    el("ul", { class: "parts-list" }, skill.d.map(part => el("li", { text: part }))),
    el("figcaption", { text: "The parts of the skill. Selection (below) picks the few that matter most." })
  ]);
}

// ---------- Videos ----------

function videosSection(skill) {
  const entry = VIDEOS[skill.id] || { q: "how to " + skill.name, list: [] };
  const search = "https://www.youtube.com/results?search_query=" + encodeURIComponent(entry.q);
  const items = entry.list.map(v => el("li", { class: "video" }, [
    el("a", { href: "https://www.youtube.com/watch?v=" + encodeURIComponent(v.v), target: "_blank", rel: "noopener noreferrer", class: "video-link" }, [
      el("img", { src: "https://i.ytimg.com/vi/" + encodeURIComponent(v.v) + "/mqdefault.jpg", alt: "", loading: "lazy", width: "160", height: "90" }),
      el("span", { class: "video-text" }, [el("span", { class: "video-title", text: v.title }), el("span", { class: "video-channel", text: v.channel })])
    ])
  ]));
  return el("section", { class: "course-step videos" }, [
    el("h2", { text: "Watch" }),
    el("p", { class: "what", text: items.length
      ? "Videos made by others that show the steps. They open on YouTube."
      : "We haven't picked a video for this skill yet." }),
    items.length ? el("ul", { class: "video-list" }, items) : null,
    el("p", {}, [el("a", { href: search, target: "_blank", rel: "noopener noreferrer", text: "More videos on YouTube" })]),
    skill.safety ? el("p", { class: "note", text: "Videos are no substitute for hands-on training from a certified instructor." }) : null
  ]);
}

// ---------- Progress (signed-in only, private) ----------

function cardStatus(skill) {
  if (!state.user) return null;
  const row = state.progress.get(skill.id);
  if (!row) return null;
  if (row.completed_at) return el("p", { class: "done", text: "Completed · " + LEVELS[row.level] });
  if (row.steps_done.length) return el("p", { class: "summary", text: `${row.steps_done.length} of ${skill.q.length} steps done` });
  if (row.level) return el("p", { class: "summary", text: "Your level: " + LEVELS[row.level] });
  return null;
}

async function persist(skill, row, statusEl) {
  try {
    await saveProgress(state.sb, state.user.id, skill.id, row);
    state.progress.set(skill.id, row);
    return true;
  } catch {
    if (statusEl) statusEl.textContent = "Couldn't save your progress. Try again.";
    return false;
  }
}

// Sequencing with a tick box per step when signed in.
function sequencingStep(skill) {
  if (!state.user) return step("3. Sequencing", "Learn in this order.", skill.q, true);
  const row = rowFor(skill.id);
  const list = el("ol", { class: "step-list" });
  skill.q.forEach((text, i) => {
    const n = i + 1;
    const box = el("input", { type: "checkbox", id: `step-${n}`, checked: row.steps_done.includes(n),
      on: { change: async e => {
        const current = rowFor(skill.id);
        const done = new Set(current.steps_done);
        if (e.target.checked) done.add(n); else done.delete(n);
        const next = { ...current, steps_done: [...done].sort((a, b) => a - b) };
        if (await persist(skill, next, $("progress-status"))) updateProgressBox(skill);
        else e.target.checked = !e.target.checked;
      } } });
    list.append(el("li", {}, [el("label", { class: "step-check", for: `step-${n}` }, [box, el("span", { text })])]));
  });
  return el("section", { class: "course-step" }, [
    el("h2", { text: "3. Sequencing" }),
    el("p", { class: "what", text: "Learn in this order. Tick each step when you've done it." }),
    list
  ]);
}

function progressBox(skill) {
  if (!state.sb) return null;
  if (!state.user) {
    return el("div", { class: "progress-box" }, [
      el("p", {}, ["Want to track your progress and level up? ", el("a", { href: "profile.html", text: "Sign in on your profile" }), "."])
    ]);
  }
  const row = rowFor(skill.id);
  const select = el("select", { id: "course-level", "aria-label": "Your level in " + skill.name,
    on: { change: async e => {
      const next = { ...rowFor(skill.id), level: Number(e.target.value) };
      if (await persist(skill, next, $("progress-status"))) { $("progress-status").textContent = "Saved."; }
    } } }, LEVELS.map((label, i) => el("option", { value: String(i), text: label, selected: row.level === i })));
  const complete = el("button", { type: "button", class: "primary", id: "complete-course", text: "Mark course complete",
    on: { click: async () => {
      const current = rowFor(skill.id);
      const next = { ...current, completed_at: new Date().toISOString(), level: levelAfterCompletion(current.level) };
      if (!(await persist(skill, next, $("progress-status")))) return;
      const completed = [...state.progress.values()].filter(r => r.completed_at).length;
      const lvl = overallLevel(completed);
      $("progress-status").textContent = `Course complete. ${skill.name} is now "${LEVELS[next.level]}". You're Level ${lvl.level}: ${lvl.title}.`;
      updateProgressBox(skill);
    } } });
  return el("div", { class: "progress-box", id: "progress-box" }, [
    el("h3", { text: "Your progress" }),
    el("p", { id: "progress-summary", class: "status" }),
    el("label", { for: "course-level", text: "Your level in this skill" }), select,
    el("div", { class: "actions" }, [complete, el("a", { href: "profile.html", text: "Open my profile" })]),
    el("p", { class: "status", id: "progress-status", "aria-live": "polite" }),
    el("p", { class: "note", text: "Only you can see your progress." })
  ]);
}

function updateProgressBox(skill) {
  const summary = $("progress-summary");
  if (!summary) return;
  const row = rowFor(skill.id);
  const all = row.steps_done.length >= skill.q.length;
  const button = $("complete-course");
  if (row.completed_at) {
    summary.replaceChildren(el("span", { class: "completed-badge", text: "Completed" }), " on " + new Date(row.completed_at).toLocaleDateString());
    button.disabled = true;
  } else {
    summary.textContent = `${row.steps_done.length} of ${skill.q.length} steps done.` + (all ? " Ready to mark complete." : " Tick every step to complete the course.");
    button.disabled = !all;
  }
  const select = $("course-level");
  if (select) select.value = String(row.level);
}

// ---------- Course ----------

function step(title, what, items, ordered) {
  return el("section", { class: "course-step" }, [
    el("h2", { text: title }),
    el("p", { class: "what", text: what }),
    el(ordered ? "ol" : "ul", {}, items.map(item => el("li", { text: item })))
  ]);
}

function inTwoWeeks() {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

function readableDate(value) {
  const d = new Date(value + "T12:00:00");
  return isNaN(d) ? value : d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

function emailText(skill, stake, date, friend) {
  const greeting = friend ? `Hi ${friend},` : "Hi,";
  return [
    greeting,
    "",
    `I'm learning a new skill: ${skill.name}. I've set myself a deadline of ${readableDate(date)}.`,
    "",
    `My stake: ${stake}`,
    "",
    "Will you hold me to it?",
    "",
    `I'm using this free course, built on Tim Ferriss's DiSSS method: ${courseUrl(skill)}`,
    "",
    "It's part of AI for Public Good, a community working on projects about AI's effects on water, energy, land and communities. Have a look, and pick a skill yourself if you like:",
    siteUrl("index.html"),
    ""
  ].join("\n");
}

function renderStakes(skill) {
  const options = [...skill.k, ...GENERIC_STAKES];
  const box = el("section", { class: "course-step stakes" });
  box.append(
    el("h2", { text: "4. Stakes" }),
    el("p", { class: "what", text: "Pick a consequence, then email it to a friend who will hold you to it. Telling someone is what makes a stake work." })
  );

  const fieldset = el("fieldset", {}, [el("legend", { text: "Choose your stake" })]);
  options.forEach((text, i) => {
    fieldset.append(el("label", { class: "check" }, [
      el("input", { type: "radio", name: "stake", value: text, checked: i === 0, on: { change: update } }),
      el("span", { text })
    ]));
  });
  const ownRadio = el("input", { type: "radio", name: "stake", value: "__own", on: { change: update } });
  const ownText = el("input", { type: "text", id: "own-stake", maxlength: "200", placeholder: "Write your own stake", "aria-label": "Your own stake",
    on: { input: () => { ownRadio.checked = true; update(); } } });
  fieldset.append(el("label", { class: "check" }, [ownRadio, el("span", { text: "My own stake:" })]), ownText);

  const date = el("input", { type: "date", id: "stake-date", value: inTwoWeeks(), min: new Date().toISOString().slice(0, 10), on: { input: update } });
  const friend = el("input", { type: "text", id: "friend-name", maxlength: "60", placeholder: "For example: Sam", on: { input: update } });
  const preview = el("div", { class: "preview", id: "email-preview", "aria-live": "polite" });
  const send = el("a", { class: "button-link", id: "email-friend", text: "Email my stake to a friend" });
  const status = el("p", { class: "status", "aria-live": "polite" });
  const copy = el("button", { type: "button", class: "secondary", text: "Copy the message", on: { click: async () => {
    try { await navigator.clipboard.writeText(preview.textContent); status.textContent = "Copied. Paste it into any message to your friend."; }
    catch { status.textContent = "Couldn't copy automatically. Select the text above and copy it."; }
  } } });

  box.append(
    fieldset,
    el("label", { for: "stake-date", text: "Finish by" }), date,
    el("label", { for: "friend-name", text: "Your friend's first name (optional)" }), friend,
    el("h3", { text: "Your message" }), preview,
    el("div", { class: "actions" }, [send, copy]),
    status,
    el("p", { class: "note", text: "The email opens in your own email app, where you add your friend's address. This site never sees or stores it." })
  );

  function chosenStake() {
    const picked = box.querySelector('input[name="stake"]:checked');
    if (!picked) return options[0];
    if (picked.value === "__own") return ownText.value.trim() || "(write your stake above)";
    return picked.value;
  }

  function update() {
    const text = emailText(skill, chosenStake(), date.value || inTwoWeeks(), friend.value.trim());
    preview.textContent = text;
    const subject = `Hold me to it: I'm learning to ${skill.name.charAt(0).toLowerCase() + skill.name.slice(1)}`;
    send.href = "mailto:?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(text);
  }
  update();
  return box;
}

function renderCourse(id) {
  const skill = SKILLS.find(s => s.id === id);
  const course = $("course");
  course.replaceChildren();
  if (!skill) {
    course.append(el("h1", { text: "Skill not found" }), el("p", { text: "Go back to the list and pick another skill." }));
    return;
  }
  document.title = skill.name + " · Useful Skills";
  course.append(
    el("p", { class: "domain", text: `${skill.cat} · Skill ${skill.n} of ${SKILLS.length}` }),
    el("h1", { text: skill.name }),
    el("p", { class: "lede", text: "Time to learn: " + skill.time }),
    skill.safety ? el("p", { class: "safety" }, [el("strong", { text: "Safety: " }), skill.safety]) : null,
    step("1. Deconstruction", "The parts this skill is made of.", skill.d, false),
    partsDiagram(skill),
    step("2. Selection", "The few parts that matter most. Get these right first.", skill.s, false),
    sequencingStep(skill),
    progressBox(skill),
    learningPathDiagram(skill),
    videosSection(skill),
    renderStakes(skill)
  );
  updateProgressBox(skill);
}

// ---------- Routing ----------

function route() {
  const hash = decodeURIComponent(location.hash.slice(1));
  if (hash.startsWith("skill-")) {
    $("view-skills").hidden = true;
    $("view-course").hidden = false;
    renderCourse(hash.slice("skill-".length));
    window.scrollTo(0, 0);
  } else {
    document.title = "Useful Skills";
    $("view-course").hidden = true;
    $("view-skills").hidden = false;
    renderList();
  }
}

$("skill-search").addEventListener("input", event => { state.query = event.target.value.trim(); renderList(); });
window.addEventListener("hashchange", route);
route();

state.sb = getClient();
if (state.sb) {
  onUser(state.sb, async user => {
    state.user = user;
    state.progress = new Map();
    if (user) {
      try { state.progress = await loadProgress(state.sb); } catch { /* the course still works without progress */ }
    }
    route();
  });
}
