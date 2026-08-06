#!/usr/bin/env node
// Dependency-free SMTP sender (implicit TLS, AUTH LOGIN). Built for Gmail/Workspace
// on smtp.gmail.com:465 with an app password, but any implicit-TLS SMTP host works.
//
// No npm install is possible on this machine (package installs are denied), so this
// speaks SMTP directly over node:tls rather than pulling in nodemailer.
//
// Config, read from .env by the caller and passed in:
//   LEAD_ALERT_SMTP_USER  — full mailbox address (also the envelope sender)
//   LEAD_ALERT_SMTP_PASS  — Google app password (16 chars, spaces are stripped)
//   LEAD_ALERT_SMTP_HOST  — default smtp.gmail.com
//   LEAD_ALERT_SMTP_PORT  — default 465
import tls from 'node:tls';

const CRLF = '\r\n';

function b64(s) {
  return Buffer.from(String(s), 'utf8').toString('base64');
}

// Bodies are base64-encoded rather than sent as 8-bit text. Two reasons: SMTP caps a
// line at 998 octets and the alert HTML is built as long single lines, and base64 is
// 7-bit clean so it needs no 8BITMIME negotiation. It also makes dot-stuffing moot —
// a base64 line can never begin with the "." that would terminate DATA early.
function b64wrap(text) {
  const encoded = Buffer.from(String(text), 'utf8').toString('base64');
  return (encoded.match(/.{1,76}/g) || ['']).join(CRLF);
}

function encodeHeader(value) {
  // RFC 2047 for non-ASCII subjects (customer names carry accents often enough).
  return /^[\x20-\x7E]*$/.test(value)
    ? value
    : `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`;
}

// `connect` is a seam for tests only — it defaults to implicit TLS and production
// never passes it. It exists so the protocol exchange can be exercised against a
// local plain-TCP mock without weakening the real transport.
export async function sendMail({ host, port, user, pass, to, from, subject, html, text, timeoutMs = 30000, connect }) {
  host = host || 'smtp.gmail.com';
  port = Number(port || 465);
  from = from || user;
  const recipients = (Array.isArray(to) ? to : String(to).split(',')).map((s) => s.trim()).filter(Boolean);
  if (!user || !pass) throw new Error('SMTP user/password not configured');
  if (!recipients.length) throw new Error('No recipient address');

  return new Promise((resolve, reject) => {
    const socket = connect
      ? connect({ host, port })
      : tls.connect({ host, port, servername: host });
    let buffer = '';
    let settled = false;
    let waiting = null; // { codes:[...], resolve, reject }

    const timer = setTimeout(() => fail(new Error(`SMTP timeout after ${timeoutMs}ms`)), timeoutMs);

    function fail(err) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { socket.destroy(); } catch { /* already gone */ }
      reject(err);
    }
    function done(value) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { socket.end(); } catch { /* already gone */ }
      resolve(value);
    }

    // Wait for a complete SMTP reply. Multiline replies use "250-" for every line
    // except the last, which uses "250 " — only then is the reply finished.
    function expect(codes) {
      return new Promise((res, rej) => { waiting = { codes, res, rej }; drain(); });
    }
    function drain() {
      if (!waiting) return;
      const match = buffer.match(/^(?:\d{3}-[^\n]*\n)*(\d{3}) [^\n]*\n/);
      if (!match) return;
      const reply = buffer.slice(0, match[0].length);
      buffer = buffer.slice(match[0].length);
      const code = Number(match[1]);
      const w = waiting;
      waiting = null;
      if (w.codes.includes(code)) w.res({ code, reply });
      else w.rej(new Error(`SMTP ${code}: ${reply.trim()}`));
    }

    socket.setEncoding('utf8');
    socket.on('data', (chunk) => { buffer += chunk; drain(); });
    socket.on('error', fail);
    socket.on('close', () => {
      if (!settled) fail(new Error('SMTP connection closed unexpectedly'));
    });

    const send = (line) => socket.write(line + CRLF);

    (async () => {
      await expect([220]);
      send('EHLO got-moles-lead-alert');
      await expect([250]);

      send('AUTH LOGIN');
      await expect([334]);
      send(b64(user));
      await expect([334]);
      send(b64(String(pass).replace(/\s+/g, ''))); // Google prints app passwords in groups of 4
      await expect([235]);

      send(`MAIL FROM:<${from}>`);
      await expect([250]);
      for (const rcpt of recipients) {
        send(`RCPT TO:<${rcpt}>`);
        await expect([250, 251]);
      }

      send('DATA');
      await expect([354]);

      const boundary = `gm_${Date.now().toString(36)}_${Math.floor(process.hrtime()[1] / 1000).toString(36)}`;
      const plain = text || String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const headers = [
        `From: Got Moles Lead Alert <${from}>`,
        `To: ${recipients.join(', ')}`,
        `Subject: ${encodeHeader(subject)}`,
        `Date: ${new Date().toUTCString()}`,
        'MIME-Version: 1.0',
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
      ].join(CRLF);

      const body = [
        `--${boundary}`,
        'Content-Type: text/plain; charset=utf-8',
        'Content-Transfer-Encoding: base64',
        '',
        b64wrap(plain),
        `--${boundary}`,
        'Content-Type: text/html; charset=utf-8',
        'Content-Transfer-Encoding: base64',
        '',
        b64wrap(html),
        `--${boundary}--`,
      ].join(CRLF);

      // Header block must be terminated by a BLANK line, hence the doubled CRLF.
      send(headers + CRLF + CRLF + body + CRLF + '.');
      await expect([250]);

      send('QUIT');
      done({ ok: true, recipients });
    })().catch(fail);
  });
}
