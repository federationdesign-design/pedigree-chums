import { NextResponse } from "next/server";
import { isAuthed } from "../../../../lib/pcSync/adminAuth";
import { getAllSessions, getAllTurns, SESSION_COLUMNS_DB, TURN_COLUMNS } from "../../../../lib/pcSync/db";
import { rowsToCsv } from "../../../../lib/pcSync/csv";

// GET /api/pc-admin/export?table=turns|sessions
//
// Streams the full turns or sessions table as a CSV download, auth-gated by the same admin cookie the viewer
// uses. The header row and column order match the recorder's local CSV export (COLUMNS / SESSION_COLUMNS), so
// a Postgres export and a browser export are interchangeable.

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  const table = new URL(req.url).searchParams.get("table");
  if (table !== "turns" && table !== "sessions") {
    return NextResponse.json({ ok: false, reason: "bad-table" }, { status: 400 });
  }

  const csv =
    table === "turns"
      ? rowsToCsv(TURN_COLUMNS, await getAllTurns())
      : rowsToCsv(SESSION_COLUMNS_DB, await getAllSessions());

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv;charset=utf-8",
      "content-disposition": `attachment; filename="pick-a-chum-${table}.csv"`,
      "cache-control": "no-store",
    },
  });
}
