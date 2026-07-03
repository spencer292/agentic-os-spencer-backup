import type { CollectionConfig } from 'payload'
import { adminOnly, editorOrAdmin } from '../lib/access'

export const Tags: CollectionConfig = {
  slug: 'tags',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: () => true,
    create: editorOrAdmin,
    update: editorOrAdmin,
    delete: adminOnly,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
  ],
}
