import pg from 'pg'
const { Client } = pg
const c = new Client({ connectionString: process.env.DATABASE_URI })
await c.connect()
async function row(label, sql) {
  try { const r = await c.query(sql); console.log(`\n=== ${label} ===`); console.table(r.rows) }
  catch(e) { console.log(`${label}: ERR ${e.message}`) }
}
await row('Pages',
  "SELECT slug, title, schema_type FROM pages ORDER BY slug")
await row('BlogPosts summary',
  "SELECT count(*)::int total, count(*) FILTER (WHERE url_pattern='legacy-root')::int legacy_root, count(*) FILTER (WHERE url_pattern='blog' OR url_pattern IS NULL)::int blog_path, count(*) FILTER (WHERE featured_image_id IS NOT NULL)::int with_featured_image FROM blog_posts")
await row('Cities count', "SELECT count(*)::int FROM cities")
await row('Services', "SELECT slug, name FROM services ORDER BY slug")
await row('Testimonials count', "SELECT count(*)::int FROM testimonials")
await row('Authors', "SELECT name, slug FROM authors")
await row('Leads', "SELECT count(*)::int FROM leads")
await row('Media', "SELECT count(*)::int FROM media")
await row('BlogPosts list', "SELECT slug, url_pattern, status FROM blog_posts ORDER BY url_pattern, slug")
await c.end()
