// Useful Skills: a list of 100 skills, a DiSSS course for each, and a stake to email to a friend.
// No sign-in and no server: the email opens in the visitor's own email app, and nothing is stored.
import { SKILLS, CATEGORIES, GENERIC_STAKES } from "./skills/index.js";

const $ = id => document.getElementById(id);
const state = { filter: "All", query: "" };

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
      el("span", { class: "more", text: "Open the course" })
    ]));
  }
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
    step("2. Selection", "The few parts that matter most. Get these right first.", skill.s, false),
    step("3. Sequencing", "Learn in this order.", skill.q, true),
    renderStakes(skill)
  );
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
