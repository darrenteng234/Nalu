import { redirect } from "next/navigation";
import { createArticleDraft, requireUser } from "@/lib/studio/actions";

export const dynamic = "force-dynamic";

const field: React.CSSProperties = { width: "100%", padding: "0.6rem 0.75rem", border: "1px solid var(--border)", borderRadius: 8, background: "var(--background)", color: "var(--text-primary)", fontSize: "0.95rem", fontFamily: "inherit" };
const label: React.CSSProperties = { fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.35rem", display: "block" };
const row: React.CSSProperties = { marginBottom: "1.1rem" };

async function create(formData: FormData) {
  "use server";
  const { contentId } = await createArticleDraft({
    title: String(formData.get("title") || ""),
    content: String(formData.get("content") || ""),
    studioType: String(formData.get("studioType") || "article"),
    locale: String(formData.get("locale") || "en"),
    heroImageUrl: String(formData.get("heroImageUrl") || ""),
    category: String(formData.get("category") || ""),
    tags: String(formData.get("tags") || ""),
    author: String(formData.get("author") || ""),
  });
  redirect(`/studio/${contentId}`);
}

export default async function NewArticle() {
  try { await requireUser(); } catch { redirect("/admin/login?redirect=/studio/new"); }
  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>New article</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: "1.25rem" }}>Paste your finished article. NALU prepares the technical details for you.</p>
      <form action={create}>
        <div style={row}><label style={label}>Title</label><input name="title" style={field} placeholder="e.g. Best AI writing tools for Malaysian small businesses" required /></div>
        <div style={row}>
          <label style={label}>Article content</label>
          <textarea name="content" style={{ ...field, minHeight: 280, lineHeight: 1.6 }} placeholder={"Paste your article here.\n\nUse ## for section headings and - for bullet points. A leading # line becomes the title."} required />
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.35rem" }}>Tip: <code>##</code> starts a section, <code>-</code> starts a bullet. An <code>## FAQ</code> section with Q:/A: lines becomes an FAQ.</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div style={row}>
            <label style={label}>Type</label>
            <select name="studioType" style={field} defaultValue="article">
              <option value="article">Article</option>
              <option value="comparison">Comparison</option>
              <option value="workflow">Workflow</option>
              <option value="tool">AI Tool</option>
            </select>
          </div>
          <div style={row}>
            <label style={label}>Language</label>
            <select name="locale" style={field} defaultValue="en">
              <option value="en">English</option>
              <option value="ms">Malaysian Malay</option>
            </select>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div style={row}><label style={label}>Author</label><input name="author" style={field} placeholder="Your name" /></div>
          <div style={row}><label style={label}>Category</label><input name="category" style={field} placeholder="e.g. Productivity" /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div style={row}><label style={label}>Hero image URL</label><input name="heroImageUrl" style={field} placeholder="https://…" /></div>
          <div style={row}><label style={label}>Tags</label><input name="tags" style={field} placeholder="comma, separated" /></div>
        </div>
        <button type="submit" style={{ padding: "0.6rem 1.4rem", borderRadius: 999, background: "var(--brand-primary)", color: "var(--brand-on,#fff)", border: "none", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer" }}>Save draft →</button>
      </form>
    </div>
  );
}
