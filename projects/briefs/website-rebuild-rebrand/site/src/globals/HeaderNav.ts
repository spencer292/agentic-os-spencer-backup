import type { GlobalConfig } from 'payload'
import { adminOnly } from '../lib/access'

export const HeaderNav: GlobalConfig = {
  slug: 'header',
  label: 'Header Navigation',
  admin: { group: 'Navigation' },
  access: {
    read: () => true,
    update: adminOnly,
  },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      required: true,
      maxRows: 6,
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'url', type: 'text', required: true },
        {
          name: 'children',
          type: 'array',
          admin: { description: 'Dropdown items. Leave empty for a simple link.' },
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'url', type: 'text', required: true },
          ],
        },
      ],
    },
    {
      name: 'ctaButton',
      type: 'group',
      fields: [
        { name: 'text', type: 'text', required: true, defaultValue: 'Get a Free Quote' },
        { name: 'url', type: 'text', required: true, defaultValue: '/contact/' },
      ],
    },
    {
      name: 'phone',
      type: 'text',
      defaultValue: '(253) 750-0211',
      admin: { description: 'Phone number displayed in header (desktop).' },
    },
  ],
}
