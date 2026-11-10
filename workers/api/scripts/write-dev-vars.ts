/**
 * `npm run db:env`: point the API at the local Supabase by setting ECHO_STORE,
 * SUPABASE_URL and SUPABASE_SECRET_KEY in workers/api/.dev.vars (git-ignored).
 * Other lines, such as GEMINI_API_KEY, are kept as they are. Nothing secret is printed.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { localSupabase } from "./local-supabase.ts";

const path = fileURLToPath(new URL("../.dev.vars", import.meta.url));
const { url, secretKey } = localSupabase();
const wanted: Record<string, string> = { ECHO_STORE: "supabase", SUPABASE_URL: url, SUPABASE_SECRET_KEY: secretKey };

const lines = existsSync(path) ? readFileSync(path, "utf8").split("\n") : [];
const seen = new Set<string>();
const updated = lines.map((line) => {
  const name = line.match(/^([A-Z_]+)=/)?.[1];
  if (name && name in wanted) {
    seen.add(name);
    return `${name}=${wanted[name]}`;
  }
  return line;
});
while (updated.length > 0 && updated.at(-1) === "") updated.pop();
for (const name of Object.keys(wanted)) if (!seen.has(name)) updated.push(`${name}=${wanted[name]}`);
writeFileSync(path, `${updated.join("\n")}\n`, { mode: 0o600 });

console.log("Updated workers/api/.dev.vars: ECHO_STORE=supabase, SUPABASE_URL and SUPABASE_SECRET_KEY. Restart the API.");
