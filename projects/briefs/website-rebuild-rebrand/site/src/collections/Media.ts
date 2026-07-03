import type { CollectionConfig } from 'payload'
import { adminOnly, editorOrAdmin } from '../lib/access'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'alt',
  },
  access: {
    read: () => true,
    create: editorOrAdmin,
    update: editorOrAdmin,
    delete: adminOnly,
  },
  upload: {
    staticDir: 'public/media',
    mimeTypes: ['image/*', 'video/*', 'application/pdf'],
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 300, position: 'centre' },
      { name: 'card', width: 768, height: 512, position: 'centre' },
      { name: 'hero', width: 1920, position: 'centre' },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: { description: 'Describe the image content for accessibility and SEO.' },
    },
  ],
}
