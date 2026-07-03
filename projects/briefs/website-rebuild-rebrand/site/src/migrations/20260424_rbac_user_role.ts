import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor');
    ALTER TABLE "users" ADD COLUMN "role" "public"."enum_users_role";
    UPDATE "users" SET "role" = 'admin' WHERE "role" IS NULL;
    ALTER TABLE "users" ALTER COLUMN "role" SET NOT NULL;
    ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'editor';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "users" DROP COLUMN "role";
    DROP TYPE "public"."enum_users_role";
  `)
}
