import type { LocaleCode } from "./locales";

/**
 * UI chrome strings (navigation, labels) per locale. This is INTERFACE copy,
 * authored here; CONTENT is translated through the pipeline (docs/specs/03).
 * Keys are stable; add a locale = add a column.
 */
type UIKey =
  | "nav_tutorials" | "nav_tools" | "nav_prompts" | "nav_collections" | "nav_search"
  | "related" | "faq" | "search_placeholder" | "search_title" | "search_empty"
  | "not_found_title" | "not_found_body" | "home_intro" | "skip";

export const UI: Record<LocaleCode, Record<UIKey, string>> = {
  en: {
    nav_tutorials: "Tutorials", nav_tools: "AI Tools", nav_prompts: "Prompts", nav_collections: "Learning Paths", nav_search: "Search",
    related: "Related", faq: "Frequently asked questions", search_placeholder: "Search NALU…", search_title: "Search",
    search_empty: "No results yet. Try another term.", not_found_title: "Page not found",
    not_found_body: "This page may not be published in this language yet.", home_intro: "A multilingual technology knowledge library.", skip: "Skip to content",
  },
  ms: {
    nav_tutorials: "Tutorial", nav_tools: "Alat AI", nav_prompts: "Gesaan", nav_collections: "Laluan Pembelajaran", nav_search: "Cari",
    related: "Berkaitan", faq: "Soalan lazim", search_placeholder: "Cari NALU…", search_title: "Cari",
    search_empty: "Tiada hasil lagi. Cuba istilah lain.", not_found_title: "Halaman tidak ditemui",
    not_found_body: "Halaman ini mungkin belum diterbitkan dalam bahasa ini.", home_intro: "Perpustakaan pengetahuan teknologi berbilang bahasa.", skip: "Langkau ke kandungan",
  },
  th: {
    nav_tutorials: "บทเรียน", nav_tools: "เครื่องมือ AI", nav_prompts: "พรอมป์", nav_collections: "เส้นทางการเรียนรู้", nav_search: "ค้นหา",
    related: "ที่เกี่ยวข้อง", faq: "คำถามที่พบบ่อย", search_placeholder: "ค้นหา NALU…", search_title: "ค้นหา",
    search_empty: "ยังไม่มีผลลัพธ์ ลองใช้คำอื่น", not_found_title: "ไม่พบหน้านี้",
    not_found_body: "หน้านี้อาจยังไม่ได้เผยแพร่ในภาษานี้", home_intro: "คลังความรู้ด้านเทคโนโลยีหลายภาษา", skip: "ข้ามไปยังเนื้อหา",
  },
  vi: {
    nav_tutorials: "Hướng dẫn", nav_tools: "Công cụ AI", nav_prompts: "Prompt", nav_collections: "Lộ trình học", nav_search: "Tìm kiếm",
    related: "Liên quan", faq: "Câu hỏi thường gặp", search_placeholder: "Tìm trong NALU…", search_title: "Tìm kiếm",
    search_empty: "Chưa có kết quả. Hãy thử từ khác.", not_found_title: "Không tìm thấy trang",
    not_found_body: "Trang này có thể chưa được xuất bản bằng ngôn ngữ này.", home_intro: "Thư viện kiến thức công nghệ đa ngôn ngữ.", skip: "Chuyển đến nội dung",
  },
};

export function t(locale: string, key: UIKey): string {
  return (UI[locale as LocaleCode] ?? UI.en)[key] ?? UI.en[key];
}
