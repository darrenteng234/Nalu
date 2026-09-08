import type { CollectionConfig } from "payload";

/**
 * Operations model (docs/specs/PHASE_2_11_OPERATIONS_DASHBOARD.md §3).
 * Drives the Build dashboard. Tasks/criteria/activity are DATA — TODAY/BLOCKERS/
 * NEXT and progress % are computed by queries over these, never hardcoded in the UI.
 */
const editorReadable = ({ req }: { req: { user?: unknown } }) => Boolean(req.user);

export const PhaseTasks: CollectionConfig = {
  slug: "phase-tasks",
  admin: { group: "Operations", useAsTitle: "title", defaultColumns: ["phase", "area", "title", "status", "priority"] },
  access: { read: editorReadable },
  indexes: [{ fields: ["status"] }, { fields: ["phase"] }],
  fields: [
    { name: "phase", type: "text", required: true },
    { name: "area", type: "select", required: true, options: ["translation", "seo", "qa", "extraction", "infra", "dashboard", "launch"].map((v) => ({ label: v, value: v })) },
    { name: "title", type: "text", required: true },
    { name: "status", type: "select", required: true, defaultValue: "todo", options: ["todo", "in_progress", "blocked", "done"].map((v) => ({ label: v, value: v })) },
    { name: "priority", type: "select", required: true, defaultValue: "medium", options: ["high", "medium", "low"].map((v) => ({ label: v, value: v })) },
    { name: "blockedBy", type: "text" },
    { name: "evidence", type: "text" },
  ],
};

export const AcceptanceCriteria: CollectionConfig = {
  slug: "acceptance-criteria",
  admin: { group: "Operations", useAsTitle: "criterion", defaultColumns: ["phase", "area", "criterion", "result"] },
  access: { read: editorReadable },
  indexes: [{ fields: ["phase"] }, { fields: ["result"] }],
  fields: [
    { name: "phase", type: "text", required: true },
    { name: "area", type: "text" },
    { name: "criterion", type: "text", required: true },
    { name: "result", type: "select", required: true, defaultValue: "not_verified", options: ["pass", "fail", "not_verified"].map((v) => ({ label: v, value: v })) },
    { name: "evidence", type: "text" },
  ],
};

export const ActivityLog: CollectionConfig = {
  slug: "activity-log",
  admin: { group: "Operations", useAsTitle: "action", defaultColumns: ["actor", "action", "entity", "outcome", "createdAt"] },
  access: { read: editorReadable },
  indexes: [{ fields: ["actor"] }, { fields: ["outcome"] }],
  fields: [
    { name: "actor", type: "text", required: true, admin: { description: "system | editor:<id>" } },
    { name: "action", type: "text", required: true },
    { name: "entity", type: "text" },
    { name: "locale", type: "text" },
    { name: "detail", type: "text" },
    { name: "outcome", type: "select", defaultValue: "ok", options: ["ok", "failed", "review_required"].map((v) => ({ label: v, value: v })) },
  ],
  timestamps: true,
};
