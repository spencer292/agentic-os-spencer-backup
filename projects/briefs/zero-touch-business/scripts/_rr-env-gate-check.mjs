import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const content = fs.readFileSync(envPath, 'utf8');
const lines = content.split(/\r?\n/);
const keys = [
  'ROUTE_READY_ADS_CUSTOMER_ID',
  'ROUTE_READY_ADS_DEVELOPER_TOKEN',
  'ROUTE_READY_ADS_CLIENT_ID',
  'ROUTE_READY_ADS_CLIENT_SECRET',
  'ROUTE_READY_ADS_REFRESH_TOKEN',
  'ROUTE_READY_ADS_LOGIN_CUSTOMER_ID',
];
const present = {};
for (const line of lines) {
  const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m && keys.includes(m[1])) {
    present[m[1]] = m[2] && m[2].trim().length > 0;
  }
}
const missing = keys.filter((k) => !present[k]);
if (missing.length) {
  console.log('MISSING: ' + missing.join(', '));
  process.exit(1);
} else {
  console.log('ALL_PRESENT');
  process.exit(0);
}
