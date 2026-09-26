/* SAVE CODES: THE STORE, 27 September 2026 (owner, J18-315). Server only. The same
   Neon Postgres the Pick a Chum recorder uses (lib/pcSync/db.ts), found through the
   same environment variables, with its own table:

     pc_saves (code text primary key, data jsonb, created_at, updated_at)

   Created on first use, idempotently, as the recorder's tables are. Every write
   goes through sanitise(), and an update is merged with what is already stored,
   so a device that is behind can never wipe progress made on another. */
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { makeCode } from "./codes";
import { mergeSnapshots, sanitise, type Snapshot } from "./snapshot";

function conn(): string {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING || "";
}
export function hasSaveStore(): boolean {
  return conn() !== "";
}
let client: NeonQueryFunction<false, false> | null = null;
function sql(): NeonQueryFunction<false, false> {
  const c = conn();
  if (!c) throw new Error("saves: no Postgres store connected");
  if (!client) client = neon(c);
  return client;
}
let ensured: Promise<void> | null = null;
function ensure(): Promise<void> {
  if (!ensured) {
    ensured = (async () => {
      await sql()`
        CREATE TABLE IF NOT EXISTS pc_saves (
          code        text PRIMARY KEY,
          data        jsonb NOT NULL,
          created_at  timestamptz NOT NULL DEFAULT now(),
          updated_at  timestamptz NOT NULL DEFAULT now()
        )
      `;
    })().catch((e) => { ensured = null; throw e; });
  }
  return ensured;
}

/** Store a new save and return its code. Retries on the rare code collision. */
export async function createSave(snap: Snapshot): Promise<string> {
  await ensure();
  for (let i = 0; i < 8; i++) {
    const code = makeCode();
    const rows = await sql()`
      INSERT INTO pc_saves (code, data) VALUES (${code}, ${JSON.stringify(snap)}::jsonb)
      ON CONFLICT (code) DO NOTHING
      RETURNING code
    `;
    if (rows.length) return code;
  }
  throw new Error("saves: could not find a free code");
}

export async function readSave(code: string): Promise<Snapshot | null> {
  await ensure();
  const rows = await sql()`SELECT data FROM pc_saves WHERE code = ${code}`;
  return rows.length ? sanitise(rows[0].data) : null;
}

/** Merge a snapshot into an existing save. Returns the merged save, or null if the code is unknown. */
export async function updateSave(code: string, snap: Snapshot): Promise<Snapshot | null> {
  const current = await readSave(code);
  if (!current) return null;
  const merged = mergeSnapshots(current, snap);
  await sql()`UPDATE pc_saves SET data = ${JSON.stringify(merged)}::jsonb, updated_at = now() WHERE code = ${code}`;
  return merged;
}
