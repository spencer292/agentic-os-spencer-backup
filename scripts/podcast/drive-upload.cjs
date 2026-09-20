/**
 * Upload a local binary file to Google Drive, routed through a throwaway n8n
 * workflow that uses the "Google Docs account 4" credential (Drive scope) —
 * we have no local Drive OAuth and the JSON-only drive-via-n8n route can't send
 * binary. A Code node assembles a multipart/related body (metadata + raw bytes)
 * and an httpRequest node POSTs it to the Drive multipart upload endpoint.
 *
 * Usage: node scripts/podcast/drive-upload.cjs <localPath> <folderId> <driveName>
 * Prints the new Drive file id as: FILE_ID=<id>
 */
const fs = require('fs');
const { runTempWorkflow, hookNode, DOCS_CRED } = require('../lib/n8n-temp-workflow.cjs');

const env = {};
for (const l of fs.readFileSync('C:/Claude/agent-os-v3/agentic-os/.env', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
// n8n base URL, webhook base, target project and the Drive-scoped credential now
// live in scripts/lib/n8n-temp-workflow.cjs — the single owner of the temp-workflow flow.
const [localPath, folderId, driveName] = process.argv.slice(2);
if (!localPath || !folderId || !driveName) { console.log('usage: drive-upload.cjs <localPath> <folderId> <driveName>'); process.exit(1); }

const b64 = fs.readFileSync(localPath).toString('base64');
const mime = localPath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

// Code node: build the multipart/related body and emit it as a binary property.
const jsCode = `
const b64 = ${JSON.stringify(b64)};
const meta = JSON.stringify({ name: ${JSON.stringify(driveName)}, parents: [${JSON.stringify(folderId)}] });
const boundary = 'pmpbnd' + $runIndex + Math.floor(1e9 * 0.5);
const pre = '--' + boundary + '\\r\\nContent-Type: application/json; charset=UTF-8\\r\\n\\r\\n' + meta + '\\r\\n--' + boundary + '\\r\\nContent-Type: ${mime}\\r\\n\\r\\n';
const post = '\\r\\n--' + boundary + '--';
const body = Buffer.concat([Buffer.from(pre, 'utf8'), Buffer.from(b64, 'base64'), Buffer.from(post, 'utf8')]);
return [{ json: {}, binary: { data: { data: body.toString('base64'), mimeType: 'multipart/related; boundary=' + boundary, fileName: 'upload.bin' } } }];
`;

// The binary multipart upload needs a bespoke node pair, so these are declared here
// rather than via the shared httpNode() helper (which only covers JSON/text calls).
const uploadNodes = [
  { id: 'code', name: 'Build', type: 'n8n-nodes-base.code', typeVersion: 2, position: [220, 0],
    parameters: { jsCode } },
  { id: 'up', name: 'Upload', type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [440, 0],
    parameters: {
      method: 'POST',
      url: 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true',
      authentication: 'predefinedCredentialType', nodeCredentialType: 'googleDocsOAuth2Api',
      sendBody: true, contentType: 'binaryData', inputDataFieldName: 'data',
      options: {},
    }, credentials: DOCS_CRED },
];
const wfConnections = {
  Hook: { main: [[{ node: 'Build', type: 'main', index: 0 }]] },
  Build: { main: [[{ node: 'Upload', type: 'main', index: 0 }]] },
};

// Lifecycle AND teardown live in scripts/lib/n8n-temp-workflow.cjs. Do not re-inline this.
(async () => {
  const out = await runTempWorkflow({
    apiKey: env.N8N_API_KEY,
    tag: 'up',
    attempts: 15,
    delayMs: 2000,
    buildNodes: (hookPath) => [hookNode(hookPath), ...uploadNodes],
    connections: wfConnections,
  });
  let parsed; try { parsed = JSON.parse(out); } catch {}
  const fileId = parsed?.id || parsed?.body?.id;
  if (fileId) console.log('FILE_ID=' + fileId);
  else console.log('NO_FILE_ID', out.slice(0, 600));
})().catch(e => console.log('Error:', e.message));
