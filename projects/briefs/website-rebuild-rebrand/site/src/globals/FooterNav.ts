import type { GlobalConfig } from 'payload'
import { adminOnly } from '../lib/access'

export const FooterNav: GlobalConfig = {
  slug: 'footer',
  label: 'Footer',
  admin: { group: 'Navigation' },
  access: {
    read: () => true,
    update: adminOnly,
  },
  fields: [
    {
      name: 'brandDescription',
      type: 'textarea',
      defaultValue: "Western Washington's mole-exclusive specialist. Veteran-owned. Chemical-free. Proven results.",
    },
    {
      name: 'columns',
      type: 'array',
      required: true,
      maxRows: 4,
      fields: [
        { name: 'title', type: 'text', required: true },
        {
          name: 'links',
          type: 'array',
          required: true,
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'url', type: 'text', required: true },
          ],
        },
      ],
    },
    {
      name: 'serviceArea',
      type: 'text',
      defaultValue: 'Serving King, Pierce, Snohomish, Thurston, Kitsap & Lewis Counties',
    },
    {
      name: 'legalLinks',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'url', type: 'text', required: true },
      ],
    },
    {
      name: 'copyright',
      type: 'text',
      defaultValue: 'Got Moles. All rights reserved. Veteran-Owned.',
    },
  ],
}
