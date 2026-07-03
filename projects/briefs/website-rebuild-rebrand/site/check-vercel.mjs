// Lists env var names that contain "vercel" (case-insensitive).
// Does not print values — just names — to help find the right var without exposing secrets.
const names = Object.keys(process.env).filter((k) => k.toLowerCase().includes('vercel'))
console.log('Vercel-related env vars present:', names)
// Also check common Vercel token names
const candidates = ['VERCEL_TOKEN', 'VERCEL_API_TOKEN', 'VERCEL_KEY']
for (const c of candidates) {
  console.log(`  ${c}:`, process.env[c] ? 'SET' : 'unset')
}
console.log('VERCEL_TEAM_ID:', process.env.VERCEL_TEAM_ID || 'unset')
console.log('VERCEL_PROJECT_ID:', process.env.VERCEL_PROJECT_ID || 'unset')
console.log('VERCEL_ORG_ID:', process.env.VERCEL_ORG_ID || 'unset')
