// Community Ideas Commons: front end on Supabase.
// Signed-out visitors see the built-in and approved projects. Everything else needs sign-in.
import { createClient } from "./vendor/supabase.esm.js";
import { BUILT_IN } from "./built-in.js";

const DOMAINS = ["All", "Water", "Air", "Energy", "Land", "Community", "Cognition"];
const OFFER_TYPES = [["time", "Time"], ["expertise", "Expertise"], ["resources", "Resources"], ["ideas", "Ideas"], ["network", "Network"]];
const SCRATCH_ID = "scratchpad";
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;

const cfg = window.APP_CONFIG || {};
const $ = id => document.getElementById(id);

const state = {
  sb: null,
  user: null,
  isAdmin: false,
  profiles: {},
  projects: [],        // approved projects from the database
  comments: [],
  offers: [],
  suggestions: [],    // the signed-in person's own suggestions, plus all of them for the admin
  hot: new Set(),
  messages: [],       // conversations about offers that the signed-in person is part of
  composing: null,    // offer id whose "send a message" box is open     // project ids with offers from 3+ people in 30 days (computed in the database)
  filter: "All",
  editing: null       // { table, id } for the one entry being edited inline
};

// ---------- Small helpers ----------

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

function messageFor(err) {
  const code = err && err.code;
  if (code === "42501") return "Only the team can do that, or this is not your entry.";
  if (code === "23514") return "Check your text: it may be too long, or it contains an email address. Offers and comments must not include contact details.";
  if (code === "22023" || code === "P0002") return "That suggestion has already been reviewed or no longer exists.";
  if (code === "PGRST301" || code === "401") return "Your sign-in has expired. Sign in again.";
  if (code === "54000") return "You've sent a lot of messages in the last hour. Try again later.";
  return "Could not save. Try again.";
}

function safeLink(url) {
  return typeof url === "string" && /^https:\/\//.test(url) ? url : null;
}

function nameFor(uid, anonymous) {
  if (anonymous) return "Someone";
  const p = state.profiles[uid];
  return (p && p.name) || "Someone";
}

function allProjects() {
  const byId = {};
  for (const p of BUILT_IN) byId[p.id] = p;
  for (const p of state.projects) byId[p.id] = p;
  return byId;
}

// The database counts distinct people, including anonymous offers whose authors the browser never sees.
function isHot(projectId) {
  return state.hot.has(projectId);
}

function byDate(a, b, key = "created_at") {
  return String(a[key]).localeCompare(String(b[key]));
}

function fmtDate(value) {
  const d = new Date(value);
  return isNaN(d) ? "" : " · " + d.toLocaleDateString();
}

// ---------- Data ----------

async function loadAll() {
  const sb = state.sb;
  const projectsRes = await sb.from("projects").select("id, domain, title, body, sources, channels").order("created_at", { ascending: true });
  if (projectsRes.error) return setNotice(messageFor(projectsRes.error));
  state.projects = projectsRes.data.map(p => ({ ...p, sources: p.sources || [], channels: p.channels || [] }));

  if (!state.user) {
    state.comments = []; state.offers = []; state.suggestions = []; state.profiles = {}; state.isAdmin = false; state.hot = new Set(); state.messages = [];
    return;
  }

  const [profilesRes, adminRes, commentsRes, offersRes, suggestionsRes, hotRes, messagesRes] = await Promise.all([
    sb.from("profiles").select("id, name"),
    sb.from("admins").select("user_id").eq("user_id", state.user.id),
    sb.from("comments").select("id, project_id, author_id, body, created_at").order("created_at", { ascending: true }),
    sb.rpc("list_offers"),
    sb.from("suggestions").select("id, author_id, origin, title, domain, body, source_url, help_needed, status, project_id, created_at").order("created_at", { ascending: true }),
    sb.rpc("hot_project_ids"),
    sb.rpc("list_messages")
  ]);
  const failed = [profilesRes, adminRes, commentsRes, offersRes, suggestionsRes, hotRes, messagesRes].find(r => r.error);
  if (failed) return setNotice(messageFor(failed.error));

  state.profiles = {};
  for (const p of profilesRes.data) state.profiles[p.id] = p;
  state.isAdmin = adminRes.data.length > 0;
  state.comments = commentsRes.data;
  state.offers = offersRes.data;
  state.suggestions = suggestionsRes.data;
  state.hot = new Set((hotRes.data || []).map(row => (typeof row === "string" ? row : row.hot_project_ids)));
  state.messages = messagesRes.data || [];
}

// ---------- Views ----------

function showView(name) {
  for (const view of ["list", "project", "suggest", "review", "messages"]) {
    $("view-" + view).hidden = view !== name;
  }
}

function renderAuth() {
  const box = $("auth");
  box.replaceChildren();
  if (!state.sb) return;
  if (!state.user) {
    const status = el("p", { class: "status", id: "auth-status", "aria-live": "polite" });
    const email = el("input", { id: "auth-email", type: "email", autocomplete: "email", placeholder: "you@example.org", maxlength: "200", "aria-label": "Email address" });
    const send = el("button", { type: "button", class: "primary", text: "Email me a sign-in link", on: { click: async () => {
      const value = email.value.trim();
      if (!value || !EMAIL_RE.test(value)) { status.textContent = "Enter an email address."; return; }
      status.textContent = "Sending…";
      const { error } = await state.sb.auth.signInWithOtp({ email: value, options: { emailRedirectTo: redirectUrl() } });
      status.textContent = error ? "Could not send the link. Try again in a minute." : "Check your email for a sign-in link. It opens this page.";
    } } });
    const google = el("button", { type: "button", class: "secondary", text: "Continue with Google", on: { click: async () => {
      const { error } = await state.sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectUrl() } });
      if (error) status.textContent = "Google sign-in is not available right now.";
    } } });
    box.append(
      el("p", { class: "note", text: "Sign in to comment, offer help, or suggest a project. The project list is open to everyone." }),
      el("div", { class: "auth-row" }, [email, send]),
      el("div", { class: "auth-row" }, [google]),
      status
    );
    return;
  }
  const me = state.profiles[state.user.id] || {};
  const name = el("input", { id: "name-input", maxlength: "60", placeholder: "Your name (shown with comments)", value: me.name || "", "aria-label": "Your name" });
  const status = el("p", { class: "status", "aria-live": "polite" });
  const save = el("button", { type: "button", class: "secondary", text: "Save name", on: { click: async () => {
    const value = name.value.trim();
    const { error } = await state.sb.from("profiles").update({ name: value || null }).eq("id", state.user.id);
    if (error) status.textContent = messageFor(error);
    else { status.textContent = "Saved."; await refresh(); }
  } } });
  const out = el("button", { type: "button", class: "secondary", text: "Sign out", on: { click: async () => { await state.sb.auth.signOut(); } } });
  box.append(
    el("div", { class: "auth-row" }, [name, save, out]),
    status,
    el("p", { class: "note", text: state.isAdmin ? "You are the team admin." : "" })
  );
}

function renderChips() {
  const chips = $("chips");
  chips.replaceChildren();
  for (const area of DOMAINS) {
    chips.append(el("button", { type: "button", class: "chip", "aria-pressed": String(state.filter === area), text: area, on: { click: () => { state.filter = area; renderList(); } } }));
  }
}

function matchesFilter(project) {
  if (state.filter === "All") return true;
  return (project.domain || "").toLowerCase().includes(state.filter.toLowerCase());
}

function renderList() {
  renderChips();
  const cards = $("cards");
  cards.replaceChildren();
  const projects = Object.values(allProjects()).filter(matchesFilter);
  if (!projects.length) cards.append(el("p", { class: "empty", text: "No projects in this area yet. Suggest one." }));
  for (const project of projects) {
    const comments = state.comments.filter(c => c.project_id === project.id).length;
    const offers = state.offers.filter(o => o.project_id === project.id).length;
    const meta = [
      el("span", { text: `${comments} comment${comments === 1 ? "" : "s"}` }),
      el("span", { text: `${offers} offer${offers === 1 ? "" : "s"}` })
    ];
    if (state.user && isHot(project.id)) meta.unshift(el("span", { class: "hot", text: "Hot: several people are offering help" }));
    const body = project.body || "";
    cards.append(el("a", { class: "card", href: "#project-" + project.id }, [
      el("p", { class: "domain", text: project.domain }),
      el("h3", { text: project.title }),
      el("p", { class: "summary", text: body.slice(0, 180) + (body.length > 180 ? "…" : "") }),
      el("div", { class: "meta" }, meta),
      el("span", { class: "more", text: "Open project and offer help" })
    ]));
  }
  if (!state.user) {
    cards.append(el("p", { class: "note", text: "Comments, offers and suggestions are for signed-in people." }));
  }
}

function renderProjectHead(project) {
  const head = $("project-head");
  head.replaceChildren();
  head.append(el("p", { class: "domain", text: project.domain }), el("h1", { text: project.title }), el("p", { text: project.body }));
  if (project.channels && project.channels.length) {
    head.append(el("p", { class: "channels", text: "Where people could help: " + project.channels.join(" · ") }));
  }
  if (project.sources && project.sources.length) {
    const line = el("p", { class: "sources" }, ["Sources: "]);
    project.sources.forEach((source, i) => {
      if (i) line.append(", ");
      const href = safeLink(source.url);
      if (href) line.append(el("a", { href, target: "_blank", rel: "noopener noreferrer", text: source.name }));
      else line.append(source.name);
    });
    head.append(line);
  }
  if (state.user && isHot(project.id)) {
    head.append(el("p", { class: "hot", text: "Hot: several people have offered help in the last 30 days." }));
  }
  if (state.isAdmin && state.projects.some(p => p.id === project.id)) {
    head.append(el("div", { class: "actions" }, [
      el("button", { type: "button", class: "danger", text: "Remove this project", on: { click: async () => {
        if (!window.confirm("Remove this project from the list? Its comments and offers are removed too.")) return;
        const { error } = await state.sb.from("projects").delete().eq("id", project.id);
        if (error) return setNotice(messageFor(error));
        location.hash = "";
        await refresh();
      } } })
    ]));
  }
}

// Shared buttons for an entry's author and for the admin.
function entryActions(row, { onEdit, table }) {
  // Offers come with is_mine, because anonymous offers hide author_id from everyone but the author.
  const mine = !!state.user && (typeof row.is_mine === "boolean" ? row.is_mine : row.author_id === state.user.id);
  const nodes = [];
  if (mine && onEdit) nodes.push(el("button", { type: "button", class: "secondary", text: "Edit", on: { click: () => { state.editing = { table, id: row.id }; render(); } } }));
  if (mine || state.isAdmin) {
    nodes.push(el("button", { type: "button", class: "danger", text: "Delete", on: { click: async () => {
      if (!window.confirm("Delete this entry? This cannot be undone.")) return;
      const { error } = await state.sb.from(table).delete().eq("id", row.id);
      if (error) return setNotice(messageFor(error));
      state.editing = null;
      await refresh();
    } } }));
  }
  return nodes.length ? el("div", { class: "actions entry-actions" }, nodes) : null;
}

function editor(row, table, fields, onSave) {
  const inputs = {};
  const status = el("p", { class: "status", "aria-live": "polite" });
  const nodes = [];
  for (const f of fields) {
    if (f.checkbox) {
      inputs[f.key] = el("input", { type: "checkbox", id: `edit-${f.key}`, checked: !!row[f.key] });
      nodes.push(el("label", { class: "check", for: `edit-${f.key}` }, [inputs[f.key], " " + f.label]));
      continue;
    }
    inputs[f.key] = f.multiline
      ? el("textarea", { maxlength: String(f.max), id: `edit-${f.key}`, "aria-label": f.label }, [row[f.key] || ""])
      : el("input", { maxlength: String(f.max), id: `edit-${f.key}`, value: row[f.key] || "", "aria-label": f.label });
    nodes.push(el("label", { for: `edit-${f.key}`, text: f.label }), inputs[f.key]);
  }
  const values = () => Object.fromEntries(fields.map(f => [f.key, f.checkbox ? inputs[f.key].checked : inputs[f.key].value.trim()]));
  nodes.push(el("div", { class: "actions" }, [
    el("button", { type: "button", class: "primary", text: "Save", on: { click: async () => {
      status.textContent = "";
      const { error } = await onSave(values());
      if (error) status.textContent = messageFor(error);
      else { state.editing = null; await refresh(); }
    } } }),
    el("button", { type: "button", class: "secondary", text: "Cancel", on: { click: () => { state.editing = null; render(); } } })
  ]));
  nodes.push(status);
  return el("div", { class: "editor" }, nodes);
}

function renderOffers(projectId) {
  const list = $("offers-list");
  list.replaceChildren();
  const offers = state.offers.filter(o => o.project_id === projectId).sort((a, b) => byDate(a, b));
  if (!offers.length) list.append(el("p", { class: "empty", text: "No offers yet. Be the first to offer help." }));
  for (const offer of offers) {
    const label = (OFFER_TYPES.find(t => t[0] === offer.type) || [, offer.type])[1];
    if (state.editing && state.editing.table === "offers" && state.editing.id === offer.id) {
      list.append(el("div", { class: "entry" }, [
        editor(offer, "offers", [
          { key: "details", label: "What you can offer", max: 1000, multiline: true },
          { key: "available", label: "When you're available (optional)", max: 120 },
          { key: "contact_ok", label: "Other members may contact me about this offer through the site", checkbox: true }
        ], values => state.sb.from("offers").update(values).eq("id", offer.id))
      ]));
      continue;
    }
    list.append(el("div", { class: "entry" }, [
      el("p", { class: "meta-line", text: `${nameFor(offer.author_id, offer.anonymous)} offered ${label.toLowerCase()}` + fmtDate(offer.created_at) }),
      el("p", { class: "body", text: offer.details }),
      offer.available ? el("p", { class: "meta-line", text: "Available: " + offer.available }) : null,
      el("p", { class: "meta-line", text: offer.contact_ok ? "Open to being contacted through the site" : "Not taking messages" }),
      contactControls(offer),
      entryActions(offer, { onEdit: true, table: "offers" })
    ]));
  }
}

// "Send a message" on someone else's offer, when they agreed to be contacted.
function contactControls(offer) {
  if (!state.user || !offer.contact_ok || offer.is_mine) return null;
  if (state.composing !== offer.id) {
    return el("div", { class: "actions entry-actions" }, [
      el("button", { type: "button", class: "secondary", text: "Send a message", on: { click: () => { state.composing = offer.id; render(); } } })
    ]);
  }
  const box = el("textarea", { maxlength: "1000", id: "compose-" + offer.id, "aria-label": "Your message", placeholder: "Say what you'd like to ask or arrange." });
  const status = el("p", { class: "status", "aria-live": "polite" });
  return el("div", { class: "editor" }, [
    el("label", { for: "compose-" + offer.id, text: "Your message (your name is shown to them; no email addresses)" }),
    box,
    el("div", { class: "actions" }, [
      el("button", { type: "button", class: "primary", text: "Send", on: { click: async () => {
        const body = box.value.trim();
        if (!body) { status.textContent = "Write a message first."; return; }
        if (EMAIL_RE.test(body)) { status.textContent = "Messages can't include email addresses."; return; }
        const { error } = await state.sb.rpc("send_message", { p_offer: offer.id, p_body: body });
        if (error) { status.textContent = messageFor(error); return; }
        state.composing = null;
        await refresh();
        setNotice("Message sent. You'll find the conversation under Messages.");
      } } }),
      el("button", { type: "button", class: "secondary", text: "Cancel", on: { click: () => { state.composing = null; render(); } } })
    ]),
    status
  ]);
}

function renderMessages() {
  const list = $("messages-list");
  list.replaceChildren();
  if (!state.user) { list.append(el("p", { class: "empty", text: "Sign in to see your messages." })); return; }
  const threads = new Map();
  for (const m of state.messages) {
    const key = m.offer_id + ":" + m.asker_id;
    if (!threads.has(key)) threads.set(key, []);
    threads.get(key).push(m);
  }
  if (!threads.size) { list.append(el("p", { class: "empty", text: "No messages yet. On a project page, offers marked \"open to being contacted\" have a Send a message button." })); return; }
  const projects = allProjects();
  const ordered = [...threads.values()].sort((a, b) => byDate(b[b.length - 1], a[a.length - 1]));
  for (const msgs of ordered) {
    const first = msgs[0];
    const project = projects[first.project_id];
    const other = first.i_am_offerer ? nameFor(first.asker_id) : (first.offerer_id ? nameFor(first.offerer_id) : "Someone (anonymous offer)");
    const thread = el("div", { class: "entry thread" }, [
      el("p", { class: "domain", text: project ? project.title : "A project" }),
      el("h3", { text: (first.i_am_offerer ? "About your offer, with " : "About an offer by ") + other })
    ]);
    for (const m of msgs) {
      thread.append(el("div", { class: "message" + (m.from_me ? " mine" : "") }, [
        el("p", { class: "meta-line", text: (m.from_me ? "You" : other) + fmtDate(m.created_at) }),
        el("p", { class: "body", text: m.body }),
        m.from_me || state.isAdmin ? el("div", { class: "actions entry-actions" }, [
          el("button", { type: "button", class: "danger", text: "Delete", on: { click: async () => {
            if (!window.confirm("Delete this message?")) return;
            const { error } = await state.sb.rpc("delete_message", { p_id: m.id });
            if (error) return setNotice(messageFor(error));
            await refresh();
          } } })
        ]) : null
      ]));
    }
    const box = el("textarea", { maxlength: "1000", "aria-label": "Reply", placeholder: "Write a reply" });
    const status = el("p", { class: "status", "aria-live": "polite" });
    thread.append(box, el("div", { class: "actions" }, [
      el("button", { type: "button", class: "primary", text: "Reply", on: { click: async () => {
        const body = box.value.trim();
        if (!body) { status.textContent = "Write a reply first."; return; }
        if (EMAIL_RE.test(body)) { status.textContent = "Messages can't include email addresses."; return; }
        const { error } = first.i_am_offerer
          ? await state.sb.rpc("reply_message", { p_offer: first.offer_id, p_asker: first.asker_id, p_body: body })
          : await state.sb.rpc("send_message", { p_offer: first.offer_id, p_body: body });
        if (error) { status.textContent = error.code === "42501" && !first.i_am_offerer ? "This person is no longer taking messages about this offer." : messageFor(error); return; }
        await refresh();
      } } })
    ]), status);
    list.append(thread);
  }
}

function renderComments(projectId) {
  const list = $("comments-list");
  list.replaceChildren();
  const comments = state.comments.filter(c => c.project_id === projectId).sort((a, b) => byDate(a, b));
  if (!comments.length) list.append(el("p", { class: "empty", text: "No comments yet." }));
  for (const comment of comments) {
    if (state.editing && state.editing.table === "comments" && state.editing.id === comment.id) {
      list.append(el("div", { class: "entry" }, [
        editor(comment, "comments", [{ key: "body", label: "Your comment", max: 2000, multiline: true }],
          values => state.sb.from("comments").update(values).eq("id", comment.id))
      ]));
      continue;
    }
    list.append(el("div", { class: "entry" }, [
      el("p", { class: "meta-line", text: nameFor(comment.author_id) + fmtDate(comment.created_at) }),
      el("p", { class: "body", text: comment.body }),
      entryActions(comment, { onEdit: true, table: "comments" })
    ]));
  }
}

function renderProject(projectId) {
  const project = allProjects()[projectId] || (projectId === SCRATCH_ID
    ? { id: SCRATCH_ID, domain: "General", title: "Scratch pad", body: "Open thoughts that don't fit a project yet. Post a note and see what others are noticing." }
    : null);
  showView("project");
  if (!project) {
    $("project-head").replaceChildren(el("h1", { text: "Project not found" }), el("p", { text: "It may have been removed. Go back to the list." }));
    $("offer-panel").hidden = true;
    $("comment-panel").hidden = true;
    return;
  }
  renderProjectHead(project);
  const signedIn = !!state.user;
  $("offer-panel").hidden = projectId === SCRATCH_ID;
  $("offer-signin").hidden = signedIn;
  $("offer-form").hidden = !signedIn;
  $("comment-signin").hidden = signedIn;
  $("comment-form").hidden = !signedIn;
  if (projectId !== SCRATCH_ID) renderOffers(projectId);
  else $("offers-list").replaceChildren();
  renderComments(projectId);
}

function renderSuggest() {
  const signedIn = !!state.user;
  $("suggest-signin").hidden = signedIn;
  $("suggest-form").hidden = !signedIn;
  const mine = $("my-suggestions");
  mine.replaceChildren();
  if (!signedIn) return;
  const own = state.suggestions.filter(s => s.author_id === state.user.id).sort((a, b) => byDate(b, a));
  mine.append(el("h3", { text: "Your suggestions" }));
  if (!own.length) mine.append(el("p", { class: "empty", text: "You have not suggested a project yet." }));
  for (const s of own) {
    if (state.editing && state.editing.table === "suggestions" && state.editing.id === s.id) {
      mine.append(el("div", { class: "entry" }, [
        editor(s, "suggestions", [
          { key: "title", label: "Project title", max: 120 },
          { key: "body", label: "What is the project, and why does it matter?", max: 1500, multiline: true },
          { key: "source_url", label: "A public source (optional, starts with https://)", max: 300 },
          { key: "help_needed", label: "What help would it need?", max: 600, multiline: true }
        ], values => {
          if (values.source_url && !safeLink(values.source_url)) return Promise.resolve({ error: { code: "23514" } });
          return state.sb.from("suggestions").update({ ...values, source_url: values.source_url || "" }).eq("id", s.id);
        })
      ]));
      continue;
    }
    const statusText = { pending: "Waiting for the team's review", approved: "Approved and on the list", declined: "Not taken forward" }[s.status] || s.status;
    mine.append(el("div", { class: "entry" }, [
      el("p", { class: "domain", text: s.domain }),
      el("h3", { text: s.title }),
      el("p", { class: "meta-line", text: statusText + fmtDate(s.created_at) }),
      s.status === "pending" ? entryActions(s, { onEdit: true, table: "suggestions" }) : entryActions(s, { onEdit: false, table: "suggestions" })
    ]));
  }
}

function renderReview() {
  $("nav-review").hidden = !state.isAdmin;
  const list = $("review-list");
  list.replaceChildren();
  if (!state.isAdmin) {
    list.append(el("p", { class: "empty", text: "Only the team admin can review suggestions." }));
    return;
  }
  const pending = state.suggestions.filter(s => s.status === "pending").sort((a, b) => byDate(a, b));
  if (!pending.length) list.append(el("p", { class: "empty", text: "No suggestions waiting for review." }));
  for (const s of pending) {
    const status = el("p", { class: "status", "aria-live": "polite" });
    const approve = el("button", { type: "button", class: "primary", text: "Approve", on: { click: async () => {
      approve.disabled = decline.disabled = true;
      const { error } = await state.sb.rpc("approve_suggestion", { p_id: s.id });
      if (error) { status.textContent = messageFor(error); approve.disabled = decline.disabled = false; return; }
      await refresh();
    } } });
    const decline = el("button", { type: "button", class: "secondary", text: "Decline", on: { click: async () => {
      approve.disabled = decline.disabled = true;
      const { error } = await state.sb.from("suggestions").update({ status: "declined" }).eq("id", s.id);
      if (error) { status.textContent = messageFor(error); approve.disabled = decline.disabled = false; return; }
      await refresh();
    } } });
    list.append(el("div", { class: "entry" }, [
      el("p", { class: "domain", text: s.domain }),
      el("h3", { text: s.title }),
      el("p", { class: "body", text: s.body }),
      el("p", { class: "meta-line", text: "Help needed: " + (s.help_needed || "not stated") }),
      el("p", { class: "meta-line", text: (s.origin === "scout" ? "Suggested by the Scout agent from public search results. Check the source before approving" : "Suggested by " + nameFor(s.author_id)) + fmtDate(s.created_at) }),
      safeLink(s.source_url) ? el("p", { class: "sources" }, [el("a", { href: safeLink(s.source_url), target: "_blank", rel: "noopener noreferrer", text: "Source" })]) : null,
      el("div", { class: "actions" }, [approve, decline]),
      status
    ]));
  }
}

// ---------- Routing and rendering ----------

function render() {
  renderAuth();
  const hash = decodeURIComponent(location.hash.slice(1));
  $("nav-review").hidden = !state.isAdmin;
  $("nav-messages").hidden = !state.user;
  $("nav-messages").textContent = state.messages.length ? `Messages (${new Set(state.messages.map(m => m.offer_id + ":" + m.asker_id)).size})` : "Messages";
  if (hash.startsWith("project-")) renderProject(hash.replace(/^project-/, ""));
  else if (hash === "suggest") { showView("suggest"); renderSuggest(); }
  else if (hash === "review") { showView("review"); renderReview(); }
  else if (hash === "messages") { showView("messages"); renderMessages(); }
  else { showView("list"); renderList(); }
}

function redirectUrl() {
  return location.origin + location.pathname;
}

async function refresh() {
  try {
    await loadAll();
  } catch (err) {
    setNotice("The site could not reach the database. Try again in a moment.");
  }
  render();
}

// ---------- Writes ----------

function requireSignIn(statusEl) {
  if (!state.user) { statusEl.textContent = "Sign in to do this."; return false; }
  return true;
}

function bindForms() {
  $("comment-form").addEventListener("submit", async event => {
    event.preventDefault();
    const status = $("comment-status");
    const text = $("comment-text").value.trim();
    if (!text || !requireSignIn(status)) return;
    $("comment-submit").disabled = true;
    status.textContent = "";
    const { error } = await state.sb.from("comments").insert({ project_id: decodeURIComponent(location.hash.slice(1)).replace(/^project-/, ""), body: text });
    $("comment-submit").disabled = false;
    if (error) { status.textContent = messageFor(error); return; }
    $("comment-text").value = "";
    status.textContent = "Posted.";
    await refresh();
  });

  $("offer-form").addEventListener("submit", async event => {
    event.preventDefault();
    const status = $("offer-status");
    const details = $("offer-details").value.trim();
    if (!details) { status.textContent = "Say what you can offer."; return; }
    if (!requireSignIn(status)) return;
    $("offer-submit").disabled = true;
    status.textContent = "";
    const { error } = await state.sb.from("offers").insert({
      project_id: decodeURIComponent(location.hash.slice(1)).replace(/^project-/, ""),
      type: $("offer-type").value,
      details,
      available: $("offer-available").value.trim(),
      anonymous: $("offer-anon").checked,
      contact_ok: $("offer-contact").checked
    });
    $("offer-submit").disabled = false;
    if (error) { status.textContent = messageFor(error); return; }
    $("offer-details").value = "";
    $("offer-available").value = "";
    $("offer-anon").checked = false;
    $("offer-contact").checked = false;
    status.textContent = "Thanks. Your offer is recorded and visible to people who can open this page.";
    await refresh();
  });

  $("suggest-form").addEventListener("submit", async event => {
    event.preventDefault();
    const status = $("suggest-status");
    const title = $("suggest-title").value.trim();
    const body = $("suggest-body").value.trim();
    const source = $("suggest-source").value.trim();
    if (!title || !body) { status.textContent = "Add a title and a description."; return; }
    if (source && !safeLink(source)) { status.textContent = "The source must start with https://"; return; }
    if (!requireSignIn(status)) return;
    $("suggest-submit").disabled = true;
    status.textContent = "";
    const { error } = await state.sb.from("suggestions").insert({
      title,
      domain: $("suggest-domain").value,
      body,
      source_url: source,
      help_needed: $("suggest-help").value.trim()
    });
    $("suggest-submit").disabled = false;
    if (error) { status.textContent = messageFor(error); return; }
    for (const id of ["suggest-title", "suggest-body", "suggest-source", "suggest-help"]) $(id).value = "";
    status.textContent = "Thanks. The team reviews each suggestion, and approved projects appear on the list.";
    await refresh();
  });
}

// ---------- Start ----------

async function start() {
  if (!cfg.supabaseUrl || !cfg.supabaseKey) {
    setNotice("The database is not configured for this copy of the site. You are seeing the built-in projects only.");
    state.projects = [];
    render();
    window.addEventListener("hashchange", render);
    return;
  }
  state.sb = createClient(cfg.supabaseUrl, cfg.supabaseKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  bindForms();
  window.addEventListener("hashchange", () => { state.editing = null; state.composing = null; render(); });
  // The INITIAL_SESSION event fires once on subscribe, so this also loads the signed-out view.
  // Supabase calls made inside this callback deadlock on the auth lock when a session exists,
  // so the reload is deferred until the callback has returned.
  state.sb.auth.onAuthStateChange((_event, session) => {
    state.user = session ? session.user : null;
    setTimeout(refresh, 0);
  });
}

start();
