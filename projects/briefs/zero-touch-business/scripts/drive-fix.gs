/**
 * Route Ready — one-shot Drive fixer v3.
 * Trash search with NO query-language title filter: iterate all trashed files,
 * filter by name in JS, restore + share converted ones, write links doc.
 */
function fixRouteReadyDrive() {
  var GOOGLE_MIMES = {
    'application/vnd.google-apps.spreadsheet': 'https://docs.google.com/spreadsheets/d/{ID}/copy',
    'application/vnd.google-apps.document': 'https://docs.google.com/document/d/{ID}/copy'
  };
  var restored = [];
  var scanned = 0;
  var it = DriveApp.searchFiles('trashed = true');
  while (it.hasNext()) {
    var f = it.next();
    scanned++;
    var mime = f.getMimeType();
    if (f.getName().indexOf('route-ready-') === 0 &&
        f.getName().indexOf('route-ready-copy-links') === -1 &&
        GOOGLE_MIMES[mime]) {
      f.setTrashed(false);
      f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      restored.push({
        name: f.getName(),
        id: f.getId(),
        type: mime.indexOf('spreadsheet') > -1 ? 'sheet' : 'doc',
        copy_link: GOOGLE_MIMES[mime].replace('{ID}', f.getId())
      });
    }
  }
  var it2 = DriveApp.getFiles();
  while (it2.hasNext()) {
    var g = it2.next();
    var m2 = g.getMimeType();
    if (g.getName().indexOf('route-ready-') === 0 &&
        g.getName().indexOf('route-ready-copy-links') === -1 &&
        GOOGLE_MIMES[m2] &&
        !restored.some(function (r) { return r.id === g.getId(); })) {
      g.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      restored.push({
        name: g.getName(),
        id: g.getId(),
        type: m2.indexOf('spreadsheet') > -1 ? 'sheet' : 'doc',
        copy_link: GOOGLE_MIMES[m2].replace('{ID}', g.getId())
      });
    }
  }
  restored.sort(function (a, b) { return a.name < b.name ? -1 : 1; });
  var doc = DocumentApp.create('route-ready-copy-links-v3');
  doc.getBody().setText('scanned_trashed=' + scanned + String.fromCharCode(10) + JSON.stringify(restored, null, 2));
  doc.saveAndClose();
  Logger.log('Scanned trashed: ' + scanned + '; restored+shared: ' + restored.length);
  return restored.length;
}
