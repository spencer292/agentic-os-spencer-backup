import type { CollectionConfig } from 'payload'
import { adminOnly, editorOrAdmin } from '../lib/access'

export const Authors: CollectionConfig = {
  slug: 'authors',
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
    { name: 'role', type: 'text' },
    { name: 'bio', type: 'textarea' },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    { name: 'veteranStatus', type: 'checkbox', defaultValue: false },
  ],
}
