import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('en', 'ms', 'th', 'vi');
  CREATE TYPE "public"."enum_users_roles" AS ENUM('admin', 'editor', 'reviewer');
  CREATE TYPE "public"."enum_users_review_locales" AS ENUM('en', 'ms', 'th', 'vi');
  CREATE TYPE "public"."enum_sources_type" AS ENUM('tutorial', 'prompt_page', 'prompt', 'collection', 'tool', 'compare_platform', 'compare_tools', 'review', 'role_page', 'blog_post', 'community_post', 'free_tool', 'article');
  CREATE TYPE "public"."enum_sources_difficulty" AS ENUM('beginner', 'intermediate', 'advanced');
  CREATE TYPE "public"."enum_sources_ingest_status" AS ENUM('extracted', 'structured', 'error');
  CREATE TYPE "public"."enum_sources_lifecycle_status" AS ENUM('active', 'source_missing', 'review_required', 'unpublished', 'archived');
  CREATE TYPE "public"."enum_variants_locale" AS ENUM('en', 'ms', 'th', 'vi');
  CREATE TYPE "public"."enum_variants_type" AS ENUM('tutorial', 'prompt_page', 'prompt', 'collection', 'tool', 'compare_platform', 'compare_tools', 'review', 'role_page', 'blog_post', 'community_post', 'free_tool', 'article');
  CREATE TYPE "public"."enum_variants_status" AS ENUM('draft', 'mt_generated', 'in_review', 'approved', 'published', 'archived');
  CREATE TYPE "public"."enum_slug_history_locale" AS ENUM('en', 'ms', 'th', 'vi');
  CREATE TYPE "public"."enum_categories_kind" AS ENUM('course_category', 'tool_category', 'role');
  CREATE TYPE "public"."enum_source_snapshots_scope_decision" AS ENUM('in-scope', 'out-of-scope');
  CREATE TYPE "public"."enum_source_snapshots_extraction_status" AS ENUM('ok', 'partial', 'failed');
  CREATE TYPE "public"."enum_phase_tasks_area" AS ENUM('translation', 'seo', 'qa', 'extraction', 'infra', 'dashboard', 'launch');
  CREATE TYPE "public"."enum_phase_tasks_status" AS ENUM('todo', 'in_progress', 'blocked', 'done');
  CREATE TYPE "public"."enum_phase_tasks_priority" AS ENUM('high', 'medium', 'low');
  CREATE TYPE "public"."enum_acceptance_criteria_result" AS ENUM('pass', 'fail', 'not_verified');
  CREATE TYPE "public"."enum_activity_log_outcome" AS ENUM('ok', 'failed', 'review_required');
  CREATE TABLE "users_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "users_review_locales" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_review_locales",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "media_locales" (
  	"alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "sources_relationships" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"rel" varchar NOT NULL,
  	"target_content_id" varchar NOT NULL,
  	"order" numeric
  );
  
  CREATE TABLE "sources" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"content_id" varchar NOT NULL,
  	"type" "enum_sources_type" NOT NULL,
  	"source_version" numeric DEFAULT 1 NOT NULL,
  	"field_hashes" jsonb,
  	"source_url" varchar,
  	"difficulty" "enum_sources_difficulty",
  	"date_published" timestamp(3) with time zone,
  	"date_modified" timestamp(3) with time zone,
  	"image_id" integer,
  	"has_video" boolean DEFAULT false,
  	"neutral_data" jsonb,
  	"ingest_status" "enum_sources_ingest_status" DEFAULT 'extracted',
  	"last_ingest_run_id" varchar,
  	"lifecycle_status" "enum_sources_lifecycle_status" DEFAULT 'active',
  	"source_missing_since" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "variants" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"content_id" varchar NOT NULL,
  	"locale" "enum_variants_locale" NOT NULL,
  	"type" "enum_variants_type" NOT NULL,
  	"status" "enum_variants_status" DEFAULT 'draft' NOT NULL,
  	"published_at" timestamp(3) with time zone,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"summary" varchar,
  	"sections" jsonb,
  	"faq" jsonb,
  	"body" jsonb,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_og_image_id" integer,
  	"seo_noindex" boolean DEFAULT false,
  	"translation_translated_from_source_version" numeric,
  	"translation_translation_version" numeric DEFAULT 0,
  	"translation_localization_version" numeric DEFAULT 0,
  	"translation_confidence" jsonb,
  	"translation_field_status" jsonb,
  	"translation_stale" boolean DEFAULT false,
  	"translation_reviewer_id" integer,
  	"translation_review_notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "slug_history" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"content_id" varchar NOT NULL,
  	"locale" "enum_slug_history_locale" NOT NULL,
  	"type" varchar NOT NULL,
  	"old_slug" varchar NOT NULL,
  	"new_slug" varchar NOT NULL,
  	"changed_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"kind" "enum_categories_kind" NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "categories_locales" (
  	"label" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "source_snapshots" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"content_id" varchar,
  	"source_url" varchar NOT NULL,
  	"source_type" varchar,
  	"source_identifier" varchar,
  	"retrieved_at" timestamp(3) with time zone NOT NULL,
  	"raw_hash" varchar,
  	"http_status" numeric,
  	"scope_decision" "enum_source_snapshots_scope_decision",
  	"extraction_status" "enum_source_snapshots_extraction_status",
  	"field_coverage" jsonb,
  	"normalized_snapshot" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "phase_tasks" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"phase" varchar NOT NULL,
  	"area" "enum_phase_tasks_area" NOT NULL,
  	"title" varchar NOT NULL,
  	"status" "enum_phase_tasks_status" DEFAULT 'todo' NOT NULL,
  	"priority" "enum_phase_tasks_priority" DEFAULT 'medium' NOT NULL,
  	"blocked_by" varchar,
  	"evidence" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "acceptance_criteria" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"phase" varchar NOT NULL,
  	"area" varchar,
  	"criterion" varchar NOT NULL,
  	"result" "enum_acceptance_criteria_result" DEFAULT 'not_verified' NOT NULL,
  	"evidence" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "activity_log" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"actor" varchar NOT NULL,
  	"action" varchar NOT NULL,
  	"entity" varchar,
  	"locale" varchar,
  	"detail" varchar,
  	"outcome" "enum_activity_log_outcome" DEFAULT 'ok',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"sources_id" integer,
  	"variants_id" integer,
  	"slug_history_id" integer,
  	"categories_id" integer,
  	"source_snapshots_id" integer,
  	"phase_tasks_id" integer,
  	"acceptance_criteria_id" integer,
  	"activity_log_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_review_locales" ADD CONSTRAINT "users_review_locales_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_locales" ADD CONSTRAINT "media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sources_relationships" ADD CONSTRAINT "sources_relationships_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sources" ADD CONSTRAINT "sources_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "variants" ADD CONSTRAINT "variants_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "variants" ADD CONSTRAINT "variants_translation_reviewer_id_users_id_fk" FOREIGN KEY ("translation_reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories_locales" ADD CONSTRAINT "categories_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_sources_fk" FOREIGN KEY ("sources_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_variants_fk" FOREIGN KEY ("variants_id") REFERENCES "public"."variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_slug_history_fk" FOREIGN KEY ("slug_history_id") REFERENCES "public"."slug_history"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_source_snapshots_fk" FOREIGN KEY ("source_snapshots_id") REFERENCES "public"."source_snapshots"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_phase_tasks_fk" FOREIGN KEY ("phase_tasks_id") REFERENCES "public"."phase_tasks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_acceptance_criteria_fk" FOREIGN KEY ("acceptance_criteria_id") REFERENCES "public"."acceptance_criteria"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_activity_log_fk" FOREIGN KEY ("activity_log_id") REFERENCES "public"."activity_log"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_roles_order_idx" ON "users_roles" USING btree ("order");
  CREATE INDEX "users_roles_parent_idx" ON "users_roles" USING btree ("parent_id");
  CREATE INDEX "users_review_locales_order_idx" ON "users_review_locales" USING btree ("order");
  CREATE INDEX "users_review_locales_parent_idx" ON "users_review_locales" USING btree ("parent_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE UNIQUE INDEX "media_locales_locale_parent_id_unique" ON "media_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "sources_relationships_order_idx" ON "sources_relationships" USING btree ("_order");
  CREATE INDEX "sources_relationships_parent_id_idx" ON "sources_relationships" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "sources_content_id_idx" ON "sources" USING btree ("content_id");
  CREATE INDEX "sources_type_idx" ON "sources" USING btree ("type");
  CREATE INDEX "sources_source_version_idx" ON "sources" USING btree ("source_version");
  CREATE INDEX "sources_image_idx" ON "sources" USING btree ("image_id");
  CREATE INDEX "sources_lifecycle_status_idx" ON "sources" USING btree ("lifecycle_status");
  CREATE INDEX "sources_updated_at_idx" ON "sources" USING btree ("updated_at");
  CREATE INDEX "sources_created_at_idx" ON "sources" USING btree ("created_at");
  CREATE INDEX "variants_content_id_idx" ON "variants" USING btree ("content_id");
  CREATE INDEX "variants_locale_idx" ON "variants" USING btree ("locale");
  CREATE INDEX "variants_status_idx" ON "variants" USING btree ("status");
  CREATE INDEX "variants_slug_idx" ON "variants" USING btree ("slug");
  CREATE INDEX "variants_seo_seo_og_image_idx" ON "variants" USING btree ("seo_og_image_id");
  CREATE INDEX "variants_translation_translation_stale_idx" ON "variants" USING btree ("translation_stale");
  CREATE INDEX "variants_translation_translation_reviewer_idx" ON "variants" USING btree ("translation_reviewer_id");
  CREATE INDEX "variants_updated_at_idx" ON "variants" USING btree ("updated_at");
  CREATE INDEX "variants_created_at_idx" ON "variants" USING btree ("created_at");
  CREATE UNIQUE INDEX "contentId_locale_idx" ON "variants" USING btree ("content_id","locale");
  CREATE INDEX "locale_type_status_idx" ON "variants" USING btree ("locale","type","status");
  CREATE UNIQUE INDEX "locale_type_slug_idx" ON "variants" USING btree ("locale","type","slug");
  CREATE INDEX "slug_history_content_id_idx" ON "slug_history" USING btree ("content_id");
  CREATE INDEX "slug_history_old_slug_idx" ON "slug_history" USING btree ("old_slug");
  CREATE INDEX "slug_history_updated_at_idx" ON "slug_history" USING btree ("updated_at");
  CREATE INDEX "slug_history_created_at_idx" ON "slug_history" USING btree ("created_at");
  CREATE INDEX "locale_oldSlug_idx" ON "slug_history" USING btree ("locale","old_slug");
  CREATE UNIQUE INDEX "categories_key_idx" ON "categories" USING btree ("key");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "categories_locales_locale_parent_id_unique" ON "categories_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "source_snapshots_content_id_idx" ON "source_snapshots" USING btree ("content_id");
  CREATE INDEX "source_snapshots_updated_at_idx" ON "source_snapshots" USING btree ("updated_at");
  CREATE INDEX "source_snapshots_created_at_idx" ON "source_snapshots" USING btree ("created_at");
  CREATE INDEX "contentId_idx" ON "source_snapshots" USING btree ("content_id");
  CREATE INDEX "phase_tasks_updated_at_idx" ON "phase_tasks" USING btree ("updated_at");
  CREATE INDEX "phase_tasks_created_at_idx" ON "phase_tasks" USING btree ("created_at");
  CREATE INDEX "status_idx" ON "phase_tasks" USING btree ("status");
  CREATE INDEX "phase_idx" ON "phase_tasks" USING btree ("phase");
  CREATE INDEX "acceptance_criteria_updated_at_idx" ON "acceptance_criteria" USING btree ("updated_at");
  CREATE INDEX "acceptance_criteria_created_at_idx" ON "acceptance_criteria" USING btree ("created_at");
  CREATE INDEX "phase_1_idx" ON "acceptance_criteria" USING btree ("phase");
  CREATE INDEX "result_idx" ON "acceptance_criteria" USING btree ("result");
  CREATE INDEX "activity_log_updated_at_idx" ON "activity_log" USING btree ("updated_at");
  CREATE INDEX "activity_log_created_at_idx" ON "activity_log" USING btree ("created_at");
  CREATE INDEX "actor_idx" ON "activity_log" USING btree ("actor");
  CREATE INDEX "outcome_idx" ON "activity_log" USING btree ("outcome");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_sources_id_idx" ON "payload_locked_documents_rels" USING btree ("sources_id");
  CREATE INDEX "payload_locked_documents_rels_variants_id_idx" ON "payload_locked_documents_rels" USING btree ("variants_id");
  CREATE INDEX "payload_locked_documents_rels_slug_history_id_idx" ON "payload_locked_documents_rels" USING btree ("slug_history_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_source_snapshots_id_idx" ON "payload_locked_documents_rels" USING btree ("source_snapshots_id");
  CREATE INDEX "payload_locked_documents_rels_phase_tasks_id_idx" ON "payload_locked_documents_rels" USING btree ("phase_tasks_id");
  CREATE INDEX "payload_locked_documents_rels_acceptance_criteria_id_idx" ON "payload_locked_documents_rels" USING btree ("acceptance_criteria_id");
  CREATE INDEX "payload_locked_documents_rels_activity_log_id_idx" ON "payload_locked_documents_rels" USING btree ("activity_log_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_roles" CASCADE;
  DROP TABLE "users_review_locales" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "media_locales" CASCADE;
  DROP TABLE "sources_relationships" CASCADE;
  DROP TABLE "sources" CASCADE;
  DROP TABLE "variants" CASCADE;
  DROP TABLE "slug_history" CASCADE;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "categories_locales" CASCADE;
  DROP TABLE "source_snapshots" CASCADE;
  DROP TABLE "phase_tasks" CASCADE;
  DROP TABLE "acceptance_criteria" CASCADE;
  DROP TABLE "activity_log" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_users_roles";
  DROP TYPE "public"."enum_users_review_locales";
  DROP TYPE "public"."enum_sources_type";
  DROP TYPE "public"."enum_sources_difficulty";
  DROP TYPE "public"."enum_sources_ingest_status";
  DROP TYPE "public"."enum_sources_lifecycle_status";
  DROP TYPE "public"."enum_variants_locale";
  DROP TYPE "public"."enum_variants_type";
  DROP TYPE "public"."enum_variants_status";
  DROP TYPE "public"."enum_slug_history_locale";
  DROP TYPE "public"."enum_categories_kind";
  DROP TYPE "public"."enum_source_snapshots_scope_decision";
  DROP TYPE "public"."enum_source_snapshots_extraction_status";
  DROP TYPE "public"."enum_phase_tasks_area";
  DROP TYPE "public"."enum_phase_tasks_status";
  DROP TYPE "public"."enum_phase_tasks_priority";
  DROP TYPE "public"."enum_acceptance_criteria_result";
  DROP TYPE "public"."enum_activity_log_outcome";`)
}
