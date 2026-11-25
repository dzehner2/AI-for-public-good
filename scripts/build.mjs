// Build step for Vercel. Copies the static site into public/ and writes config.js from
// environment variables, so no keys live in the repository.
//   SUPABASE_URL              e.g. https://<project-ref>.supabase.co  (Vercel environment variable)
//   SUPABASE_PUBLISHABLE_KEY  the project's publishable (anon) key     (Vercel environment variable)
import { cpSync, mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "site");
const out = join(root, "public");

const url = process.env.SUPABASE_URL || "";
const key = process.env.SUPABASE_PUBLISHABLE_KEY || "";

if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)) {
  console.error("SUPABASE_URL must look like https://<project-ref>.supabase.co");
  process.exit(1);
}
if (!key || key.length < 20) {
  console.error("SUPABASE_PUBLISHABLE_KEY is missing or too short.");
  process.exit(1);
}
if (!existsSync(src)) {
  console.error("site/ folder not found");
  process.exit(1);
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(src, out, { recursive: true });
writeFileSync(
  join(out, "config.js"),
  `// Generated at build time from Vercel environment variables. Publishable keys are safe in the browser.\nwindow.APP_CONFIG = ${JSON.stringify({ supabaseUrl: url, supabaseKey: key })};\n`
);
console.log(`Built site to ${out} for ${url}`);
