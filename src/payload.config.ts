import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import sharp from "sharp";

import { Users } from "./collections/Users";
import { Media } from "./collections/Media";
import { Sources } from "./collections/Sources";
import { Variants } from "./collections/Variants";
import { SlugHistory } from "./collections/SlugHistory";
import { Categories } from "./collections/Categories";
import { SourceSnapshots } from "./collections/SourceSnapshots";
import { PhaseTasks, AcceptanceCriteria, ActivityLog } from "./collections/Ops";
import { Tools } from "./collections/Tools";
import { Clicks } from "./collections/Clicks";
import { Opportunities } from "./collections/Opportunities";
import { payloadLocalization } from "./lib/i18n/locales";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// Resolve the Postgres connection string. DATABASE_URL (Railway's Postgres plugin)
// wins; DATABASE_URI is the local/dev fallback. If NEITHER is set we must NOT let
// node-postgres silently fall back to its localhost default (the cause of the
// Railway `ECONNREFUSED ::1:5432 / 127.0.0.1:5432` crash) — fail fast with a clear,
// secret-free message instead. Skipped during `next build`, where the DB is not
// needed and the env var may legitimately be absent.
const dbConnectionString = process.env.DATABASE_URL || process.env.DATABASE_URI || "";
if (!dbConnectionString && process.env.NEXT_PHASE !== "phase-production-build") {
  throw new Error(
    "No PostgreSQL connection string found (checked DATABASE_URL, then DATABASE_URI). " +
      "Refusing to fall back to localhost. On Railway, ensure the service's DATABASE_URL " +
      "reference (e.g. ${{Postgres.DATABASE_URL}}) resolves — the Postgres and app services " +
      "must share the same project/environment and the referenced service name must match.",
  );
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
  },
  collections: [Users, Media, Sources, Variants, SlugHistory, Categories, SourceSnapshots, PhaseTasks, AcceptanceCriteria, ActivityLog, Tools, Clicks, Opportunities],
  // Field-level localization for taxonomy/nav only. Big content uses the
  // Variants collection for TRUE per-locale independent publish (Phase 0 F3).
  localization: payloadLocalization,
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
  db: postgresAdapter({
    // DATABASE_URL (Railway's Postgres plugin) takes priority; DATABASE_URI is the
    // local/dev fallback. Order matters: a stale localhost DATABASE_URI must NOT
    // override Railway's DATABASE_URL in production.
    pool: { connectionString: dbConnectionString },
  }),
  // Jobs queue (docs/specs/03 pipeline, docs/specs/05 scheduled sync) — tasks
  // are registered in a later phase; the queue infra is enabled here.
  jobs: {
    tasks: [],
  },
  sharp,
});
