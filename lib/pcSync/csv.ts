// CSV serialisation for the Pick a Chum Postgres export. The header row uses the recorder's own camelCase
// column KEYS (sessionId, turn, gapAfter, ...) and the same escaping as the local export (recorder-store's
// toCsv), so a file exported from Postgres opens identically to one exported in the browser.

type ColType = "text" | "int";
type ColDef = readonly [key: string, dbCol: string, type: ColType];

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function rowsToCsv(columns: readonly ColDef[], rows: Record<string, unknown>[]): string {
  const head = columns.map(([key]) => key).join(",");
  const body = rows.map((r) => columns.map(([, dbCol]) => csvCell(r[dbCol])).join(",")).join("\n");
  return `${head}\n${body}\n`;
}
