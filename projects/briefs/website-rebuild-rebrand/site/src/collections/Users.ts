import type { CollectionConfig } from 'payload'
import { adminOnly, adminOrSelf, authenticatedOnly } from '../lib/access'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    maxLoginAttempts: 5,
    lockTime: 900000, // 15 minutes (milliseconds)
    tokenExpiration: 1800, // 30 minutes (default is 7200 / 2 hours)
  },
  admin: {
    useAsTitle: 'email',
  },
  access: {
    read: authenticatedOnly,
    create: adminOnly,
    update: adminOrSelf,
    delete: adminOnly,
    admin: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'admin',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
      access: {
        update: ({ req: { user } }) => user?.role === 'admin',
      },
      admin: {
        position: 'sidebar',
        description:
          'Admins manage users and delete content. Editors can create and update content.',
      },
    },
  ],
}
