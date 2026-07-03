import path from 'path'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

// Collections
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { BlogPosts } from './collections/BlogPosts'
import { Authors } from './collections/Authors'
import { Tags } from './collections/Tags'
import { Testimonials } from './collections/Testimonials'
import { CityPages } from './collections/CityPages'
import { Services } from './collections/Services'
import { Leads } from './collections/Leads'

// Globals
import { SiteSettings } from './globals/SiteSettings'
import { HeaderNav } from './globals/HeaderNav'
import { FooterNav } from './globals/FooterNav'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' | Got Moles CMS',
    },
  },
  collections: [Users, Media, Pages, BlogPosts, Authors, Tags, Testimonials, CityPages, Services, Leads],
  globals: [SiteSettings, HeaderNav, FooterNav],
  editor: lexicalEditor(),
  secret: (() => {
    const secret = process.env.PAYLOAD_SECRET
    if (!secret) throw new Error('PAYLOAD_SECRET environment variable is required. Set it in .env.local or Vercel dashboard.')
    return secret
  })(),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: (() => {
        const uri = process.env.DATABASE_URI
        if (!uri) throw new Error('DATABASE_URI environment variable is required. Set it in .env.local or Vercel dashboard.')
        return uri
      })(),
      // Cap per-instance connections and fail fast instead of hanging when the
      // Supabase pooler is saturated. Each Vercel serverless instance gets its
      // own pool; without a connection timeout a request burst piles up unbounded
      // waiters (contributing to the 2026-06-08 EMAXCONN outage). See
      // projects/str-security-audit/2026-06-08_got-moles-security-audit.md.
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    },
  }),
  sharp,
  plugins: [
    vercelBlobStorage({
      enabled: !!process.env.BLOB_READ_WRITE_TOKEN,
      collections: { media: true },
      token: process.env.BLOB_READ_WRITE_TOKEN || '',
      clientUploads: true,
      addRandomSuffix: false,
      cacheControlMaxAge: 31536000,
    }),
  ],
})
