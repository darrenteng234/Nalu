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
    pool: { connectionString: process.env.DATABASE_URL || process.env.DATABASE_URI || "" },
  }),
  // Jobs queue (docs/specs/03 pipeline, docs/specs/05 scheduled sync) — tasks
  // are registered in a later phase; the queue infra is enabled here.
  jobs: {
    tasks: [],
  },
  sharp,
});
