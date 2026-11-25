// Shared by the profile page and the skill courses: sign-in, levels, and saving progress.
// Progress is private: only the signed-in person can read or change their own rows.
import { createClient } from "./vendor/supabase.esm.js";

export const LEVELS = ["Not yet", "Beginner", "Practising", "Confident", "Can teach"];
export const COMPLETION_CAP = 3;          // completing a course can raise a skill up to "Confident"
export const COURSES_PER_LEVEL = 3;       // overall level goes up every three completed courses
const TITLES = ["Newcomer", "Apprentice", "Handy", "Capable", "Skilled", "Seasoned", "Expert", "Master"];

// Completing a course raises that skill one level, never past Confident and never down.
export function levelAfterCompletion(level) {
  return level >= COMPLETION_CAP ? level : level + 1;
}

export function overallLevel(completedCount) {
  const level = 1 + Math.floor(completedCount / COURSES_PER_LEVEL);
  return {
    level,
    title: TITLES[Math.min(level - 1, TITLES.length - 1)],
    into: completedCount % COURSES_PER_LEVEL,
    need: COURSES_PER_LEVEL
  };
}

let client = null;
export function getClient() {
  const cfg = window.APP_CONFIG || {};
  if (!cfg.supabaseUrl || !cfg.supabaseKey) return null;
  if (!client) {
    client = createClient(cfg.supabaseUrl, cfg.supabaseKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
  }
  return client;
}

// Calls back with the signed-in user (or null) on start and on every change.
// Work is deferred out of the auth callback: Supabase calls inside it deadlock.
export function onUser(sb, callback) {
  sb.auth.onAuthStateChange((_event, session) => {
    const user = session ? session.user : null;
    setTimeout(() => callback(user), 0);
  });
}

export async function loadProgress(sb) {
  const { data, error } = await sb.from("skill_progress").select("skill_id, level, steps_done, completed_at, updated_at");
  if (error) throw error;
  const map = new Map();
  for (const row of data) map.set(row.skill_id, { ...row, steps_done: row.steps_done || [] });
  return map;
}

export async function saveProgress(sb, userId, skillId, row) {
  const record = {
    user_id: userId,
    skill_id: skillId,
    level: row.level || 0,
    steps_done: row.steps_done || [],
    completed_at: row.completed_at || null
  };
  const { error } = await sb.from("skill_progress").upsert(record, { onConflict: "user_id,skill_id" });
  if (error) throw error;
  return record;
}

export async function loadName(sb, userId) {
  const { data } = await sb.from("profiles").select("name").eq("id", userId).maybeSingle();
  return data && data.name ? data.name : "";
}

export async function loadInterview(sb) {
  const { data, error } = await sb.from("skill_interviews").select("age_band, life_stages, goals, weekly_time, skip").maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function saveInterview(sb, userId, answers) {
  const record = {
    user_id: userId,
    age_band: answers.age_band || null,
    life_stages: answers.life_stages || [],
    goals: answers.goals || [],
    weekly_time: answers.weekly_time || null,
    skip: answers.skip || []
  };
  const { error } = await sb.from("skill_interviews").upsert(record, { onConflict: "user_id" });
  if (error) throw error;
  return record;
}
