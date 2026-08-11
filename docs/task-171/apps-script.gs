// Task 171: Pedigree Chums tester-transcript receiver (Google Apps Script Web App).
//
// It receives one completed, NON-protected session at a time from the Vercel /api/pc-sync route
// (never directly from a browser) and appends its rows to two tabs, Turns and Sessions, matching the
// recorder's CSV columns. A receivedAt date column is added FIRST on each tab for pruning (below).
//
// ---- DEPLOY ----
//   1. Open the target Google Sheet, Extensions > Apps Script, paste this file, Save.
//   2. Deploy > New deployment > type "Web app". Execute as: Me. Who has access: Anyone.
//   3. Copy the /exec URL. Put it in Vercel Edge Config item pickachum_sync.endpoint, and set
//      pickachum_sync.enabled = true, only for the testing window.
//
// ---- SECURITY (state it plainly) ----
//   The /exec URL is effectively PUBLIC: anyone holding it can append rows, and Apps Script has quotas
//   that would fall over at real traffic. Acceptable for a handful of adult, opted-in testers; it is NOT a
//   private, production-grade endpoint. The URL is kept off the client (server-forwarded) and the whole
//   feature is off unless the Edge Config switch is on, which is why the switch matters.
//
// ---- PRUNING (the sheet grows forever) ----
//   Each row carries receivedAt (ISO). Prune by sorting/filtering on it and deleting old rows by hand, OR
//   enable the time-driven trigger below: Triggers (clock icon) > Add Trigger > pruneOld, Time-driven,
//   Day timer. It deletes rows older than RETENTION_DAYS from both tabs.

var TURNS_COLS = ['receivedAt','sessionId','turn','gapAfter','activeDog','route','trigger','input','outcome','action','bucket','responseId','responseText','media','transferTo','gameActive','rephrase','protected','lastTurn'];
var SESSIONS_COLS = ['receivedAt','sessionId','firstInput','turnCount','dogsUsed','dogSwitched','linkFollowed','gamesStarted','gamesFinished','hatsFound','laughCount','laughedAt','hadAppearance','endReason'];
var RETENTION_DAYS = 90;

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var now = new Date().toISOString();
    appendRows_('Turns', TURNS_COLS, payload.turns || [], now);
    appendRows_('Sessions', SESSIONS_COLS, payload.sessions || [], now);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function appendRows_(tabName, cols, rows, now) {
  if (!rows || !rows.length) return;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(tabName) || ss.insertSheet(tabName);
  if (sheet.getLastRow() === 0) sheet.appendRow(cols); // header on first write
  var out = rows.map(function (r) {
    return cols.map(function (c) {
      if (c === 'receivedAt') return now;
      var v = r[c];
      return v === undefined || v === null ? '' : v;
    });
  });
  sheet.getRange(sheet.getLastRow() + 1, 1, out.length, cols.length).setValues(out);
}

// Optional daily prune: delete rows whose receivedAt (column 1) is older than RETENTION_DAYS.
function pruneOld() {
  var cutoff = new Date().getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  ['Turns', 'Sessions'].forEach(function (tabName) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(tabName);
    if (!sheet || sheet.getLastRow() < 2) return;
    var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues(); // column 1 = receivedAt
    for (var i = values.length - 1; i >= 0; i--) {
      var t = Date.parse(values[i][0]);
      if (!isNaN(t) && t < cutoff) sheet.deleteRow(i + 2);
    }
  });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
