import { execFileSync } from "node:child_process";

/** URL and secret key of the local Supabase started by `npm run db:start`. Never printed. */
export function localSupabase(): { url: string; secretKey: string } {
  let out: string;
  try {
    out = execFileSync("npx", ["supabase", "status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    throw new Error("Local Supabase isn't running. Start it with `npm run db:start`.");
  }
  const value = (name: string) => out.match(new RegExp(`^${name}="?([^"\\n]+)"?$`, "m"))?.[1];
  const url = value("API_URL");
  const secretKey = value("SECRET_KEY") ?? value("SERVICE_ROLE_KEY");
  if (!url || !secretKey) throw new Error("`supabase status` didn't report an API URL and secret key.");
  return { url, secretKey };
}

/** Demo data and test runs only ever touch a Supabase on this machine. */
export function assertLocal(url: string): void {
  const host = new URL(url).hostname;
  if (!["127.0.0.1", "localhost", "[::1]"].includes(host)) {
    throw new Error(`Refusing to write demo data to ${host}: only a local Supabase is allowed.`);
  }
}
