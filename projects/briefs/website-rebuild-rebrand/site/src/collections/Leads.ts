import type { CollectionConfig } from 'payload'
import { adminOnly, editorOrAdmin } from '../lib/access'

export const Leads: CollectionConfig = {
  slug: 'leads',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'phone', 'zipCode', 'service', 'status', 'source', 'createdAt'],
    description: 'Contact form submissions and lead capture audit trail. Source of truth independent of GHL / Jobber.',
    group: 'Leads',
  },
  access: {
    read: editorOrAdmin,
    create: editorOrAdmin,
    update: editorOrAdmin,
    delete: adminOnly,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'phone', type: 'text', required: true },
    { name: 'email', type: 'email' },
    { name: 'zipCode', type: 'text', required: true },
    {
      name: 'service',
      type: 'select',
      required: true,
      options: [
        { label: 'Year-Round Protection (TMCP)', value: 'tmcp' },
        { label: 'One-Time Mole Removal', value: 'one-time' },
        { label: 'Commercial Service', value: 'commercial' },
        { label: 'Something Else', value: 'other' },
      ],
    },
    { name: 'message', type: 'textarea' },
    {
      name: 'source',
      type: 'select',
      required: true,
      defaultValue: 'website-contact',
      options: [
        { label: 'Website Contact Form', value: 'website-contact' },
        { label: 'ScoreApp Quiz', value: 'scoreapp' },
        { label: 'Phone-In (Manual)', value: 'phone' },
        { label: 'Other', value: 'other' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Synced to GHL', value: 'synced-ghl' },
        { label: 'Synced to Jobber', value: 'synced-jobber' },
        { label: 'Synced to Both', value: 'synced-both' },
        { label: 'Duplicate', value: 'duplicate' },
        { label: 'Outside Service Area', value: 'outside-area' },
        { label: 'Spam', value: 'spam' },
        { label: 'Failed Sync', value: 'failed-sync' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'inServiceArea',
      type: 'checkbox',
      admin: {
        position: 'sidebar',
        description: 'Set automatically from ZIP code against the WA service-area allowlist.',
      },
    },
    {
      name: 'externalIds',
      type: 'group',
      admin: { description: 'IDs returned from external systems after a successful sync.' },
      fields: [
        { name: 'ghlContactId', type: 'text' },
        { name: 'jobberClientId', type: 'text' },
      ],
    },
    {
      name: 'syncLog',
      type: 'array',
      admin: { description: 'Each attempted sync with outcome. Latest attempt last.' },
      fields: [
        {
          name: 'destination',
          type: 'select',
          required: true,
          options: [
            { label: 'GHL', value: 'ghl' },
            { label: 'Jobber', value: 'jobber' },
          ],
        },
        { name: 'success', type: 'checkbox', required: true },
        { name: 'error', type: 'text' },
        {
          name: 'timestamp',
          type: 'date',
          required: true,
          admin: { date: { pickerAppearance: 'dayAndTime' } },
        },
      ],
    },
    {
      name: 'ipAddress',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'Client IP for audit / spam investigation.',
      },
    },
    {
      name: 'userAgent',
      type: 'text',
      admin: { hidden: true },
    },
  ],
  timestamps: true,
}
