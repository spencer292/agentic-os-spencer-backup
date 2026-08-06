// Regression test for send-mail.mjs. Needs no network and no real mailbox — it runs the
// real SMTP exchange against a local mock server and asserts the delivered MIME structure.
//
//   node projects/briefs/lead-alerts/test-send-mail.mjs
//
// Two bugs this caught on the first pass, both of which would have broken every alert:
//   1. Header block was terminated by one CRLF instead of a blank line, so the whole MIME
//      body was parsed as headers.
//   2. Alert HTML is built as long single lines; sent as 8-bit they exceeded the 998-octet
//      SMTP line limit. Bodies are base64-wrapped at 76 chars now.
import net from 'node:net';
import { sendMail } from './send-mail.mjs';

const transcript = [];
let received = '';

const server = net.createServer((sock) => {
  let buf = '';
  let inData = false;
  let authStep = 0; // 0 = none, 1 = awaiting username, 2 = awaiting password
  sock.setEncoding('utf8');
  sock.write('220 mock.smtp ESMTP ready\r\n');

  sock.on('data', (chunk) => {
    buf += chunk;
    for (;;) {
      const i = buf.indexOf('\r\n');
      if (i < 0) break;
      const line = buf.slice(0, i);
      buf = buf.slice(i + 2);

      if (inData) {
        if (line === '.') {
          inData = false;
          sock.write('250 2.0.0 OK queued\r\n');
        } else {
          received += line + '\n';
        }
        continue;
      }

      transcript.push(line.startsWith('AUTH') || /^[A-Za-z0-9+/=]{8,}$/.test(line) ? '<redacted-auth>' : line);
      const cmd = line.split(' ')[0].toUpperCase();

      if (authStep === 1) { authStep = 2; sock.write('334 UGFzc3dvcmQ6\r\n'); }        // got username
      else if (authStep === 2) { authStep = 0; sock.write('235 2.7.0 Accepted\r\n'); } // got password
      else if (cmd === 'EHLO') sock.write('250-mock.smtp at your service\r\n250-SIZE 35882577\r\n250-8BITMIME\r\n250 SMTPUTF8\r\n');
      else if (cmd === 'AUTH') { authStep = 1; sock.write('334 VXNlcm5hbWU6\r\n'); }
      else if (cmd === 'MAIL') sock.write('250 2.1.0 OK\r\n');
      else if (cmd === 'RCPT') sock.write('250 2.1.5 OK\r\n');
      else if (cmd === 'DATA') { inData = true; sock.write('354 Go ahead\r\n'); }
      else if (cmd === 'QUIT') { sock.write('221 2.0.0 Bye\r\n'); sock.end(); }
      else sock.write(`502 5.5.2 Unrecognized command: ${cmd}\r\n`);
    }
  });
});

await new Promise((r) => server.listen(0, '127.0.0.1', r));
const { port } = server.address();

// Deliberately long single line — the alert HTML is built the same way.
const html = '<div style="font-family:sans-serif">'
  + '<p>Very long line to prove the 998-octet SMTP line limit is not violated: '
  + 'x'.repeat(3000) + '</p></div>';

try {
  await sendMail({
    host: '127.0.0.1',
    port,
    user: 'alerts@got-moles.com',
    pass: 'abcd efgh ijkl mnop', // fake, and spaced like Google prints app passwords
    to: 'spencer@got-moles.com',
    subject: 'New lead: Ann Fitzmaurice — 4256810412', // em dash forces RFC 2047 encoding
    html,
    text: 'Ann Fitzmaurice\n  Website form (likely)\n.leading dot line\n  4256810412',
    connect: ({ host, port }) => net.connect({ host, port }),
  });
  console.log('SEND: ok');
} catch (e) {
  console.log('SEND FAILED:', e.message);
  process.exit(1);
} finally {
  server.close();
}

// ---- assertions ----
const lines = received.split('\n');
const headerEnd = lines.indexOf('');
const headers = lines.slice(0, headerEnd).join('\n');
const bodyLines = lines.slice(headerEnd + 1);

const checks = [];
const ok = (name, cond) => checks.push([name, cond]);

const commands = transcript.filter((l) => /^(EHLO|MAIL|RCPT|DATA|QUIT)/.test(l)).join(',');
// QUIT is written then the socket closes without waiting for the 221, so the server may
// not have logged it by the time this runs. The message is already accepted (250) before
// QUIT, so it is deliberately not asserted.
ok('command order', commands
  === 'EHLO got-moles-lead-alert,MAIL FROM:<alerts@got-moles.com>,RCPT TO:<spencer@got-moles.com>,DATA');
ok('blank line terminates headers', headerEnd > 0);

const subjLine = headers.split('\n').find((l) => l.startsWith('Subject: '));
const subjDecoded = subjLine.replace(/^Subject: /, '').replace(/=\?UTF-8\?B\?(.+?)\?=/g,
  (_, b) => Buffer.from(b, 'base64').toString('utf8'));
ok('subject round-trips intact', subjDecoded === 'New lead: Ann Fitzmaurice — 4256810412');
ok('multipart declared', /Content-Type: multipart\/alternative; boundary="gm_/.test(headers));
ok('MIME-Version present', /^MIME-Version: 1\.0$/m.test(headers));
ok('no raw header leaked into body', !bodyLines.join('\n').includes('MIME-Version'));

const boundary = headers.match(/boundary="([^"]+)"/)[1];
const parts = bodyLines.join('\n').split(`--${boundary}`);
ok('two body parts + closer', parts.length === 4);
ok('plain part declared base64', /Content-Type: text\/plain[\s\S]*Content-Transfer-Encoding: base64/.test(parts[1]));
ok('html part declared base64', /Content-Type: text\/html[\s\S]*Content-Transfer-Encoding: base64/.test(parts[2]));
ok('closing boundary', bodyLines.join('\n').trimEnd().endsWith(`--${boundary}--`));

const decode = (part) => Buffer.from(part.split('\n\n').slice(1).join('\n\n').replace(/\s+/g, ''), 'base64').toString('utf8');
ok('html round-trips intact', decode(parts[2]) === html);
ok('text round-trips intact', decode(parts[1]).includes('.leading dot line'));
ok('no line exceeds 998 octets', bodyLines.every((l) => Buffer.byteLength(l) <= 998));
ok('long html line survived wrapping', decode(parts[2]).includes('x'.repeat(3000)));

let failed = 0;
for (const [name, cond] of checks) {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`);
  if (!cond) failed++;
}
console.log(`\n${checks.length - failed}/${checks.length} passed`);
process.exit(failed ? 1 : 0);
