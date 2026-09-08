import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_tools_affiliate_status" AS ENUM('none', 'available', 'pending', 'closed');
  CREATE TYPE "public"."enum_tools_commission_type" AS ENUM('recurring_pct', 'onetime_pct', 'flat', 'unknown');
  CREATE TYPE "public"."enum_opportunities_language" AS ENUM('en', 'ms', 'th', 'vi');
  CREATE TYPE "public"."enum_opportunities_search_intent" AS ENUM('informational', 'commercial', 'transactional', 'navigational');
  CREATE TYPE "public"."enum_opportunities_commercial_intent" AS ENUM('NOT_AVAILABLE', 'low', 'medium', 'high');
  CREATE TYPE "public"."enum_opportunities_freshness" AS ENUM('NOT_AVAILABLE', 'low', 'medium', 'high');
  CREATE TYPE "public"."enum_opportunities_competition_observation" AS ENUM('NOT_AVAILABLE', 'low', 'medium', 'high');
  CREATE TYPE "public"."enum_opportunities_affiliate_potential" AS ENUM('NOT_AVAILABLE', 'low', 'medium', 'high');
  CREATE TYPE "public"."enum_opportunities_nalu_uniqueness" AS ENUM('NOT_AVAILABLE', 'low', 'medium', 'high');
  CREATE TYPE "public"."enum_opportunities_confidence" AS ENUM('low', 'medium', 'high');
  CREATE TYPE "public"."enum_opportunities_decision" AS ENUM('considering', 'pursue', 'parked', 'rejected', 'published');
  CREATE TABLE "tools" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"vendor" varchar,
  	"official_url" varchar NOT NULL,
  	"category" varchar,
  	"audience" varchar,
  	"use_cases" varchar,
  	"pricing_summary" varchar,
  	"has_free_plan" boolean DEFAULT false,
  	"affiliate_status" "enum_tools_affiliate_status" DEFAULT 'none',
  	"affiliate_url" varchar,
  	"commission_type" "enum_tools_commission_type",
  	"commission_value" varchar,
  	"recurring" boolean DEFAULT false,
  	"cookie_duration" varchar,
  	"disclosure_required" boolean DEFAULT true,
  	"source_url" varchar,
  	"last_verified_at" timestamp(3) with time zone,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "clicks" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tool" varchar NOT NULL,
  	"article" varchar,
  	"source_page" varchar,
  	"locale" varchar,
  	"destination" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "opportunities_source_urls" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar
  );
  
  CREATE TABLE "opportunities" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"topic" varchar NOT NULL,
  	"candidate_keyword" varchar,
  	"language" "enum_opportunities_language" DEFAULT 'en',
  	"country" varchar DEFAULT 'MY',
  	"search_intent" "enum_opportunities_search_intent",
  	"commercial_intent" "enum_opportunities_commercial_intent" DEFAULT 'NOT_AVAILABLE',
  	"freshness" "enum_opportunities_freshness" DEFAULT 'NOT_AVAILABLE',
  	"demand_evidence" varchar,
  	"serp_observation" varchar,
  	"competition_observation" "enum_opportunities_competition_observation" DEFAULT 'NOT_AVAILABLE',
  	"affiliate_potential" "enum_opportunities_affiliate_potential" DEFAULT 'NOT_AVAILABLE',
  	"nalu_uniqueness" "enum_opportunities_nalu_uniqueness" DEFAULT 'NOT_AVAILABLE',
  	"confidence" "enum_opportunities_confidence" DEFAULT 'low',
  	"decision" "enum_opportunities_decision" DEFAULT 'considering',
  	"last_checked_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "variants" ADD COLUMN "commerce" jsonb;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "tools_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "clicks_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "opportunities_id" integer;
  ALTER TABLE "opportunities_source_urls" ADD CONSTRAINT "opportunities_source_urls_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "tools_name_idx" ON "tools" USING btree ("name");
  CREATE UNIQUE INDEX "tools_slug_idx" ON "tools" USING btree ("slug");
  CREATE INDEX "tools_category_idx" ON "tools" USING btree ("category");
  CREATE INDEX "tools_active_idx" ON "tools" USING btree ("active");
  CREATE INDEX "tools_updated_at_idx" ON "tools" USING btree ("updated_at");
  CREATE INDEX "tools_created_at_idx" ON "tools" USING btree ("created_at");
  CREATE INDEX "clicks_tool_idx" ON "clicks" USING btree ("tool");
  CREATE INDEX "clicks_article_idx" ON "clicks" USING btree ("article");
  CREATE INDEX "clicks_updated_at_idx" ON "clicks" USING btree ("updated_at");
  CREATE INDEX "clicks_created_at_idx" ON "clicks" USING btree ("created_at");
  CREATE INDEX "tool_idx" ON "clicks" USING btree ("tool");
  CREATE INDEX "article_idx" ON "clicks" USING btree ("article");
  CREATE INDEX "createdAt_idx" ON "clicks" USING btree ("created_at");
  CREATE INDEX "opportunities_source_urls_order_idx" ON "opportunities_source_urls" USING btree ("_order");
  CREATE INDEX "opportunities_source_urls_parent_id_idx" ON "opportunities_source_urls" USING btree ("_parent_id");
  CREATE INDEX "opportunities_updated_at_idx" ON "opportunities" USING btree ("updated_at");
  CREATE INDEX "opportunities_created_at_idx" ON "opportunities" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tools_fk" FOREIGN KEY ("tools_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_clicks_fk" FOREIGN KEY ("clicks_id") REFERENCES "public"."clicks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_opportunities_fk" FOREIGN KEY ("opportunities_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_tools_id_idx" ON "payload_locked_documents_rels" USING btree ("tools_id");
  CREATE INDEX "payload_locked_documents_rels_clicks_id_idx" ON "payload_locked_documents_rels" USING btree ("clicks_id");
  CREATE INDEX "payload_locked_documents_rels_opportunities_id_idx" ON "payload_locked_documents_rels" USING btree ("opportunities_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tools" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "clicks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "opportunities_source_urls" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "opportunities" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "tools" CASCADE;
  DROP TABLE "clicks" CASCADE;
  DROP TABLE "opportunities_source_urls" CASCADE;
  DROP TABLE "opportunities" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_tools_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_clicks_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_opportunities_fk";
  
  DROP INDEX "payload_locked_documents_rels_tools_id_idx";
  DROP INDEX "payload_locked_documents_rels_clicks_id_idx";
  DROP INDEX "payload_locked_documents_rels_opportunities_id_idx";
  ALTER TABLE "variants" DROP COLUMN "commerce";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "tools_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "clicks_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "opportunities_id";
  DROP TYPE "public"."enum_tools_affiliate_status";
  DROP TYPE "public"."enum_tools_commission_type";
  DROP TYPE "public"."enum_opportunities_language";
  DROP TYPE "public"."enum_opportunities_search_intent";
  DROP TYPE "public"."enum_opportunities_commercial_intent";
  DROP TYPE "public"."enum_opportunities_freshness";
  DROP TYPE "public"."enum_opportunities_competition_observation";
  DROP TYPE "public"."enum_opportunities_affiliate_potential";
  DROP TYPE "public"."enum_opportunities_nalu_uniqueness";
  DROP TYPE "public"."enum_opportunities_confidence";
  DROP TYPE "public"."enum_opportunities_decision";`)
}
