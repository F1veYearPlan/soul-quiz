/* Google Apps Script — receives quiz results and appends them to a sheet.
 * Setup is in README.md. Deploy as a Web app: Execute as "Me", access "Anyone".
 */
const SHEET_NAME = "Ledger";

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(["timestamp", "runId", "handle", "soul", "magnitude",
      "F", "W", "E", "A", "R", "V", "blood_b", "blood_d", "secondsTaken", "baseline", "picks", "ua"]);
  }
  const d = JSON.parse(e.postData.contents);
  sh.appendRow([
    d.ts, d.runId, d.handle || "", d.soul, d.magnitude,
    d.axes.F, d.axes.W, d.axes.E, d.axes.A, d.axes.R, d.axes.V, d.blood.b, d.blood.d, d.secondsTaken,
    JSON.stringify(d.baseline), JSON.stringify(d.picks), d.ua,
  ]);
  return ContentService.createTextOutput("ok");
}

function doGet() {
  return ContentService.createTextOutput("Soul Affinity ledger is listening.");
}
