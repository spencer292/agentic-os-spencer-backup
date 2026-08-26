// Fetch a rendered page from the password-protected build store, on the preview theme.
// Copy is verified against RENDERED output, never against theme source — saved section
// settings override schema defaults and a grep over the source misses them.
//
//   node scripts/fetch-page.mjs /                       > out.html
//   node scripts/fetch-page.mjs /collections/syp-billet > out.html
//
// On Git Bash prefix with MSYS_NO_PATHCONV=1, or the shell rewrites a leading "/"
// argument into a Windows path before Node sees it.
import { BASE, authenticate } from './_build-store.mjs';

const { cookieHeader } = await authenticate();
const path = process.argv[2] || '/';
const res = await fetch(BASE + path, { headers: { cookie: cookieHeader } });
process.stderr.write(`${res.status} ${path}` + String.fromCharCode(10));
process.stdout.write(await res.text());
