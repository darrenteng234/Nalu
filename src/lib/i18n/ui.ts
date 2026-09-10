import type { LocaleCode } from "./locales";

/**
 * UI chrome strings (navigation, homepage, labels) per locale. INTERFACE copy,
 * authored here; page CONTENT is translated through the pipeline (docs/specs/03).
 *
 * BM (ms) note — Phase 5 §4/§41: these are drafted in natural Malaysian Bahasa
 * Melayu (modern digital-product tone, English tech terms kept where Malaysians
 * naturally use them) but MUST pass native-speaker QA before being treated as
 * launch-ready. They are NOT mechanical translations. th/vi are inactive
 * placeholders (mirror en) until those locales launch.
 */
type UIKey =
  | "nav_explore" | "nav_prompts" | "nav_teach_ai" | "nav_workflows" | "nav_tools" | "nav_solutions"
  | "nav_search" | "nav_tutorials" | "nav_collections"
  | "related" | "faq" | "search_placeholder" | "search_title" | "search_empty"
  | "not_found_title" | "not_found_body" | "skip"
  // homepage
  | "home_intro" | "hero_title" | "hero_sub" | "hero_placeholder" | "hero_go"
  | "ex_email" | "ex_present" | "ex_research" | "ex_analyze"
  | "sec_prompts_title" | "sec_prompts_sub" | "sec_prompts_cta"
  | "sec_teach_title" | "sec_teach_sub" | "sec_teach_cta"
  | "sec_workflows_title" | "sec_workflows_sub" | "sec_workflows_cta"
  | "sec_tools_title" | "sec_tools_sub" | "sec_tools_cta"
  | "resource_title" | "resource_sub" | "resource_cta"
  // prompt / method / tool labels
  | "what_this_does" | "best_for" | "works_with" | "before_you_start" | "the_prompt"
  | "copy_prompt" | "copied" | "why_this_works" | "make_it_yours" | "steps" | "outcome"
  | "tools_label" | "tool_good_for" | "tool_weak" | "tool_pricing" | "tool_assessment"
  | "affiliate_disclosure" | "try_it"
  // footer
  | "f_explore" | "f_guides" | "f_about" | "f_methodology" | "f_contact" | "f_privacy" | "f_terms";

const en: Record<UIKey, string> = {
  nav_explore: "Explore", nav_prompts: "Prompts", nav_teach_ai: "Teach AI", nav_workflows: "Workflows", nav_tools: "Tools", nav_solutions: "Solutions",
  nav_search: "Search", nav_tutorials: "Guides", nav_collections: "Learning Paths",
  related: "Related", faq: "Frequently asked questions", search_placeholder: "Search a job, e.g. write a client email…", search_title: "What do you need help with?",
  search_empty: "No results yet. Try describing the job you want to get done.", not_found_title: "Page not found",
  not_found_body: "This page may not be published in this language yet.", skip: "Skip to content",
  home_intro: "Get more done with AI.",
  hero_title: "Get more done with AI.", hero_sub: "What do you need help with?", hero_placeholder: "Describe your job, e.g. write an email to a client", hero_go: "Find help",
  ex_email: "Write an email to a client", ex_present: "Make a presentation", ex_research: "Research a new market", ex_analyze: "Analyze an Excel file",
  sec_prompts_title: "Need a prompt?", sec_prompts_sub: "Ready-to-use starting points for real jobs.", sec_prompts_cta: "Browse all prompts",
  sec_teach_title: "Make AI work more like you", sec_teach_sub: "Teach AI your style once, then reuse it for every task.", sec_teach_cta: "Explore Teach AI",
  sec_workflows_title: "From task to done", sec_workflows_sub: "Step-by-step systems for recurring jobs.", sec_workflows_cta: "See workflows",
  sec_tools_title: "Tools worth using", sec_tools_sub: "A short, honest shortlist — matched to the job, not the commission.", sec_tools_cta: "See tools",
  resource_title: "Get the AI-at-work starter kit", resource_sub: "A practical checklist you can use today. No fluff.", resource_cta: "Get the checklist",
  what_this_does: "What this does", best_for: "Best for", works_with: "Works with", before_you_start: "Before you start", the_prompt: "The prompt",
  copy_prompt: "Copy prompt", copied: "Copied!", why_this_works: "Why this works", make_it_yours: "Make it yours", steps: "The workflow", outcome: "Outcome",
  tools_label: "Tools", tool_good_for: "Good for", tool_weak: "Where it's weak", tool_pricing: "Pricing", tool_assessment: "NALU assessment",
  affiliate_disclosure: "Some links are affiliate links. They never change which tool we recommend.", try_it: "Try it",
  f_explore: "Explore", f_guides: "Guides", f_about: "About", f_methodology: "Methodology", f_contact: "Contact", f_privacy: "Privacy", f_terms: "Terms",
};

// BM — natural Malaysian usage (DRAFT, pending native QA §4/§41).
const ms: Record<UIKey, string> = {
  nav_explore: "Terokai", nav_prompts: "Prompt", nav_teach_ai: "Ajar AI", nav_workflows: "Aliran Kerja", nav_tools: "Alatan", nav_solutions: "Penyelesaian",
  nav_search: "Cari", nav_tutorials: "Panduan", nav_collections: "Laluan Pembelajaran",
  related: "Berkaitan", faq: "Soalan lazim", search_placeholder: "Cari tugasan, cth. tulis email kepada klien…", search_title: "Apa yang anda perlukan bantuan?",
  search_empty: "Belum ada hasil. Cuba terangkan kerja yang anda mahu siapkan.", not_found_title: "Halaman tidak ditemui",
  not_found_body: "Halaman ini mungkin belum diterbitkan dalam bahasa ini.", skip: "Langkau ke kandungan",
  home_intro: "Siapkan lebih banyak kerja dengan AI.",
  hero_title: "Siapkan lebih banyak kerja dengan AI.", hero_sub: "Apa yang anda perlukan bantuan?", hero_placeholder: "Terangkan kerja anda, cth. tulis email kepada klien", hero_go: "Cari bantuan",
  ex_email: "Tulis email kepada klien", ex_present: "Buat slide pembentangan", ex_research: "Kaji pasaran baharu", ex_analyze: "Analisa fail Excel",
  sec_prompts_title: "Perlukan prompt?", sec_prompts_sub: "Titik permulaan yang boleh terus guna untuk kerja sebenar.", sec_prompts_cta: "Lihat semua prompt",
  sec_teach_title: "Buat AI bekerja lebih seperti anda", sec_teach_sub: "Ajar AI gaya anda sekali, kemudian guna semula untuk setiap tugasan.", sec_teach_cta: "Terokai Ajar AI",
  sec_workflows_title: "Dari tugasan hingga siap", sec_workflows_sub: "Sistem langkah demi langkah untuk kerja berulang.", sec_workflows_cta: "Lihat aliran kerja",
  sec_tools_title: "Alatan yang berbaloi", sec_tools_sub: "Senarai pendek yang jujur — dipilih ikut kerja, bukan komisen.", sec_tools_cta: "Lihat alatan",
  resource_title: "Dapatkan kit permulaan AI untuk kerja", resource_sub: "Senarai semak praktikal yang boleh guna hari ini. Tiada bahan kosong.", resource_cta: "Dapatkan senarai semak",
  what_this_does: "Apa ia buat", best_for: "Sesuai untuk", works_with: "Berfungsi dengan", before_you_start: "Sebelum mula", the_prompt: "Prompt",
  copy_prompt: "Salin prompt", copied: "Disalin!", why_this_works: "Kenapa ia berkesan", make_it_yours: "Sesuaikan untuk anda", steps: "Aliran kerja", outcome: "Hasil akhir",
  tools_label: "Alatan", tool_good_for: "Sesuai untuk", tool_weak: "Kelemahannya", tool_pricing: "Harga", tool_assessment: "Penilaian NALU",
  affiliate_disclosure: "Sesetengah pautan ialah pautan afiliat. Ia tidak pernah mengubah alatan yang kami cadangkan.", try_it: "Cuba",
  f_explore: "Terokai", f_guides: "Panduan", f_about: "Tentang", f_methodology: "Metodologi", f_contact: "Hubungi", f_privacy: "Privasi", f_terms: "Terma",
};

export const UI: Record<LocaleCode, Record<UIKey, string>> = { en, ms, th: en, vi: en };

export function t(locale: string, key: UIKey): string {
  return (UI[locale as LocaleCode] ?? UI.en)[key] ?? UI.en[key];
}
