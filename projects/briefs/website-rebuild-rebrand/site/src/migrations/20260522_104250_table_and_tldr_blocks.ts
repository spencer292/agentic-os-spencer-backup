import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// No-op: all schema changes (Table, TLDR, ServiceComparison, Leads, users.role)
// were already pushed to Supabase by Payload dev mode auto-sync.
// This migration exists to keep the migration history in sync.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Schema already exists in database via dev mode push
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // No-op — nothing was created by up()
}
