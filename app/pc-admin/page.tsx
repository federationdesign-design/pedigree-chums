import styles from "./pcAdmin.module.css";
import { isAuthed, isConfigured } from "../../lib/pcSync/adminAuth";
import {
  getCounts,
  getRecentSessions,
  getRecentTurns,
  hasStore,
  SESSION_COLUMNS_DB,
  TURN_COLUMNS,
} from "../../lib/pcSync/db";
import { loginAction, logoutAction } from "./actions";

// The password-protected viewer for recorded Pick a Chum turns and sessions. Unauthenticated visitors get a
// login form; the shared password (PC_SYNC_ADMIN_PASSWORD) is checked by the loginAction server action.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const RECENT_LIMIT = 200;

type Col = readonly [key: string, dbCol: string, type: "text" | "int"];

function DataTable({ columns, rows }: { columns: readonly Col[]; rows: Record<string, unknown>[] }) {
  if (rows.length === 0) return <div className={styles.empty}>No rows yet.</div>;
  return (
    <div className={styles.tableScroll}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>received</th>
            {columns.map(([key]) => (
              <th key={key}>{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>{String(r.received_at ?? "")}</td>
              {columns.map(([key, dbCol]) => (
                <td key={key}>{String(r[dbCol] ?? "")}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LoginView({ error, configured }: { error: boolean; configured: boolean }) {
  return (
    <div className={styles.loginWrap}>
      <div className={styles.card}>
        <h1>Pick a Chum recordings</h1>
        <p>Enter the admin password to view recorded turns and sessions.</p>
        {error && <div className={styles.error}>Incorrect password.</div>}
        {!configured && (
          <div className={styles.notice}>
            No admin password is set. Add <code>PC_SYNC_ADMIN_PASSWORD</code> to the project environment.
          </div>
        )}
        <form action={loginAction}>
          <label className={styles.field}>
            <span className={styles.label}>Password</span>
            <input
              className={styles.input}
              type="password"
              name="password"
              autoComplete="current-password"
              autoFocus
            />
          </label>
          <button className={styles.button} type="submit">
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const authed = await isAuthed();
  if (!authed) {
    const { error } = await searchParams;
    return <LoginView error={Boolean(error)} configured={isConfigured()} />;
  }

  const storeConnected = hasStore();
  const [counts, turns, sessions] = await Promise.all([
    getCounts(),
    getRecentTurns(RECENT_LIMIT),
    getRecentSessions(RECENT_LIMIT),
  ]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Pick a Chum recordings</h1>
        <form action={logoutAction}>
          <button className={styles.button} type="submit">
            Sign out
          </button>
        </form>
      </div>
      <p className={styles.subtitle}>
        {counts.latestReceivedAt
          ? `Latest activity: ${counts.latestReceivedAt}`
          : "No recordings received yet."}
      </p>

      {!storeConnected && (
        <div className={styles.notice}>
          No Postgres store is connected (no <code>DATABASE_URL</code> / <code>POSTGRES_URL</code>). Connect a
          store in Vercel, then reload.
        </div>
      )}

      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statNum}>{counts.turns}</div>
          <div className={styles.statLabel}>Turns</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statNum}>{counts.sessions}</div>
          <div className={styles.statLabel}>Sessions</div>
        </div>
      </div>

      <div className={styles.toolbar}>
        <a className={styles.button} href="/api/pc-admin/export?table=turns">
          Export turns CSV
        </a>
        <a className={styles.button} href="/api/pc-admin/export?table=sessions">
          Export sessions CSV
        </a>
      </div>

      <h2 className={styles.sectionTitle}>Turns (latest {RECENT_LIMIT})</h2>
      <DataTable columns={TURN_COLUMNS} rows={turns} />

      <h2 className={styles.sectionTitle}>Sessions (latest {RECENT_LIMIT})</h2>
      <DataTable columns={SESSION_COLUMNS_DB} rows={sessions} />
    </div>
  );
}
