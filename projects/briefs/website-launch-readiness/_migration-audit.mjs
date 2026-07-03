#!/usr/bin/env node
/**
 * Migration drift audit — verifies live state against
 * old-blog-migration-plan_2026-04-20.md.
 *
 * For each of the 25 old-blog URLs in the plan:
 *   - MIGRATE  → must serve at bare slug (200), no /blog/ redirect
 *   - MERGE    → must redirect to specified /blog/{new-slug}/ target (200)
 *   - REDIRECT → must redirect to specified target (200)
 *
 * Reports drift count. 0/25 = aligned with plan. Run before any DNS-related
 * decision, weekly post-launch, and any time someone changes redirects.ts
 * or a blog post's urlPattern.
 *
 * Usage:
 *   node _migration-audit.mjs              # against staging (default)
 *   STAGING=https://got-moles.com node _migration-audit.mjs  # against prod
 *
 * Source plan: ../seo-geo-reinforcement/reports/old-blog-migration-plan_2026-04-20.md
 */

const STAGING = process.env.STAGING || 'https://project-pf8c6.vercel.app'
const UA = 'Mozilla/5.0 (compatible; Googlebot/2.1)'

const PLAN = [
  ['/how-many-eyes-do-moles-have/',                    'MIGRATE',  '',                                              90, 46],
  ['/do-moles-bite/',                                  'MIGRATE',  '',                                              33, 14],
  ['/what-do-moles-eat/',                              'MERGE',    '/blog/what-do-moles-eat/',                     102,  7],
  ['/do-moles-carry-diseases/',                        'MIGRATE',  '',                                              25,  4],
  ['/are-moles-nocturnal/',                            'MIGRATE',  '',                                              17,  4],
  ['/what-species-of-moles-live-in-washington-state/', 'MERGE',    '/blog/types-of-moles-in-washington/',            9,  2],
  ['/voles-vs-moles-whats-the-difference/',            'MERGE',    '/blog/mole-vs-vole-vs-gopher/',                 80,  0],
  ['/do-moles-hibernate/',                             'MERGE',    '/blog/when-are-moles-most-active-washington/',  35,  0],
  ['/how-to-get-rid-of-ground-moles-with-vinegar/',    'MIGRATE',  '',                                               9,  0],
  ['/how-to-get-rid-of-moles-in-your-yard/',           'MERGE',    '/blog/how-to-get-rid-of-moles/',                 3,  0],
  ['/what-do-mole-holes-look-like/',                   'MIGRATE',  '',                                               3,  0],
  ['/is-a-mole-a-rodent/',                             'MIGRATE',  '',                                               1,  0],
  ['/what-attracts-moles-to-your-yard/',               'MIGRATE',  '',                                               0,  0],
  ['/can-moles-swim/',                                 'MIGRATE',  '',                                               0,  0],
  ['/how-deep-do-moles-dig/',                          'MIGRATE',  '',                                               0,  0],
  ['/moles-vs-gopher-mounds/',                         'MERGE',    '/blog/mole-vs-vole-vs-gopher/',                  0,  0],
  ['/what-works-for-mole-extermination/',              'MERGE',    '/blog/best-mole-traps/',                         0,  0],
  ['/when-are-moles-most-active/',                     'MERGE',    '/blog/when-are-moles-most-active-washington/',   0,  0],
  ['/why-do-moles-make-molehills/',                    'MIGRATE',  '',                                               0,  0],
  ['/olympia-mole-exterminator/',                      'REDIRECT', '/mole-control-olympia/',                         0,  0],
  ['/what-eats-moles/',                                'MIGRATE',  '',                                               0,  0],
  ['/are-moles-venomous/',                             'MIGRATE',  '',                                               0,  0],
  ['/how-many-babies-do-moles-have/',                  'MIGRATE',  '',                                               0,  0],
  ['/do-moles-live-in-groups/',                        'MIGRATE',  '',                                               0,  0],
  ['/are-moles-poisonous-or-venomous/',                'MIGRATE',  '',                                               0,  0],
]

async function trace(p) {
  let url = STAGING + p
  const chain = []
  for (let i = 0; i < 6; i++) {
    const r = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'manual' })
    chain.push({ status: r.status, path: url.replace(STAGING, '') })
    if (r.status >= 300 && r.status < 400) {
      const loc = r.headers.get('location')
      url = loc.startsWith('http') ? loc : STAGING + loc
    } else break
  }
  return chain
}

console.log(`Auditing migration plan vs ${STAGING}\n`)
console.log('PLAN VERDICT     URL                                                  ACTUAL CHAIN'.padEnd(170) + ' STATUS')
console.log('─'.repeat(180))

let drift = 0
for (const [url, verdict, target, ranked, top3] of PLAN) {
  const chain = await trace(url)
  const final = chain[chain.length - 1]
  const chainStr = chain.map(s => `${s.status} ${s.path}`).join(' → ')
  let aligned = '?'

  if (verdict === 'MIGRATE') {
    aligned = (final.status === 200 && !chain.some(c => /\/blog\//.test(c.path))) ? '✓' : '✗ DRIFT'
  } else if (verdict === 'MERGE' || verdict === 'REDIRECT') {
    aligned = (final.status === 200 && final.path.replace(/\/$/, '') === target.replace(/\/$/, '')) ? '✓' : '✗ DRIFT'
  }

  if (aligned.includes('DRIFT')) drift++
  console.log(
    `${verdict.padEnd(9)} kw:${String(ranked).padStart(3)} t3:${String(top3).padStart(2)}  ` +
    `${url.padEnd(53)} ${chainStr.slice(0, 70).padEnd(72)} ${aligned}`
  )
}

console.log(`\nTotal drift: ${drift}/${PLAN.length}`)
if (drift > 0) {
  console.log('\n⚠ Drift detected — investigate before launch / DNS change.')
  process.exit(1)
}
