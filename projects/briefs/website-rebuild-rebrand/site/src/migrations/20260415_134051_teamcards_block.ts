import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_team_cards_background" AS ENUM('cream', 'grass', 'grass-alt');
  CREATE TYPE "public"."enum__pages_v_blocks_team_cards_background" AS ENUM('cream', 'grass', 'grass-alt');
  ALTER TYPE "public"."enum_blog_posts_keyword_cluster" ADD VALUE IF NOT EXISTS 'biology' BEFORE 'diy-pro';
  ALTER TYPE "public"."enum__blog_posts_v_version_keyword_cluster" ADD VALUE IF NOT EXISTS 'biology' BEFORE 'diy-pro';
  CREATE TABLE "pages_blocks_team_cards_members" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" varchar,
  	"bio" varchar,
  	"photo_key" varchar
  );
  
  CREATE TABLE "pages_blocks_team_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"subheading" varchar,
  	"show_divider" boolean DEFAULT false,
  	"background" "enum_pages_blocks_team_cards_background" DEFAULT 'cream',
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_team_cards_members" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" varchar,
  	"bio" varchar,
  	"photo_key" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_team_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"subheading" varchar,
  	"show_divider" boolean DEFAULT false,
  	"background" "enum__pages_v_blocks_team_cards_background" DEFAULT 'cream',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "footer" ALTER COLUMN "brand_description" SET DEFAULT 'Western Washington''s mole-exclusive specialist. Veteran-owned. Chemical-free. Proven results.';
  ALTER TABLE "pages_blocks_team_cards_members" ADD CONSTRAINT "pages_blocks_team_cards_members_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_team_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_team_cards" ADD CONSTRAINT "pages_blocks_team_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_team_cards_members" ADD CONSTRAINT "_pages_v_blocks_team_cards_members_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_team_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_team_cards" ADD CONSTRAINT "_pages_v_blocks_team_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_team_cards_members_order_idx" ON "pages_blocks_team_cards_members" USING btree ("_order");
  CREATE INDEX "pages_blocks_team_cards_members_parent_id_idx" ON "pages_blocks_team_cards_members" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_team_cards_order_idx" ON "pages_blocks_team_cards" USING btree ("_order");
  CREATE INDEX "pages_blocks_team_cards_parent_id_idx" ON "pages_blocks_team_cards" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_team_cards_path_idx" ON "pages_blocks_team_cards" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_team_cards_members_order_idx" ON "_pages_v_blocks_team_cards_members" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_team_cards_members_parent_id_idx" ON "_pages_v_blocks_team_cards_members" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_team_cards_order_idx" ON "_pages_v_blocks_team_cards" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_team_cards_parent_id_idx" ON "_pages_v_blocks_team_cards" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_team_cards_path_idx" ON "_pages_v_blocks_team_cards" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_team_cards_members" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_team_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_team_cards_members" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_team_cards" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_team_cards_members" CASCADE;
  DROP TABLE "pages_blocks_team_cards" CASCADE;
  DROP TABLE "_pages_v_blocks_team_cards_members" CASCADE;
  DROP TABLE "_pages_v_blocks_team_cards" CASCADE;
  ALTER TABLE "blog_posts" ALTER COLUMN "keyword_cluster" SET DATA TYPE text;
  DROP TYPE "public"."enum_blog_posts_keyword_cluster";
  CREATE TYPE "public"."enum_blog_posts_keyword_cluster" AS ENUM('mole-control', 'diy-pro', 'cost-value', 'safety', 'seasonal', 'commercial');
  ALTER TABLE "blog_posts" ALTER COLUMN "keyword_cluster" SET DATA TYPE "public"."enum_blog_posts_keyword_cluster" USING "keyword_cluster"::"public"."enum_blog_posts_keyword_cluster";
  ALTER TABLE "_blog_posts_v" ALTER COLUMN "version_keyword_cluster" SET DATA TYPE text;
  DROP TYPE "public"."enum__blog_posts_v_version_keyword_cluster";
  CREATE TYPE "public"."enum__blog_posts_v_version_keyword_cluster" AS ENUM('mole-control', 'diy-pro', 'cost-value', 'safety', 'seasonal', 'commercial');
  ALTER TABLE "_blog_posts_v" ALTER COLUMN "version_keyword_cluster" SET DATA TYPE "public"."enum__blog_posts_v_version_keyword_cluster" USING "version_keyword_cluster"::"public"."enum__blog_posts_v_version_keyword_cluster";
  ALTER TABLE "footer" ALTER COLUMN "brand_description" SET DEFAULT 'Western Washington''s mole-exclusive specialist. Veteran-owned. Chemical-free. Guaranteed results.';
  DROP TYPE "public"."enum_pages_blocks_team_cards_background";
  DROP TYPE "public"."enum__pages_v_blocks_team_cards_background";`)
}
