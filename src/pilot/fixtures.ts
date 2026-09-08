import type { ContentType } from "@/lib/content/constants";
import type { LocaleCode } from "@/lib/i18n/locales";

/**
 * Controlled pilot dataset — NALU-AUTHORED ORIGINAL content (invented names),
 * NOT reproduced from Techpresso. It is shaped like the public content types to
 * exercise every template + the full pipeline at tiny scale. English is the
 * master; ms/th/vi are authored reference translations that stand in for the
 * pipeline's translation provider (the live LLM provider is a later, keyed step).
 */

export interface PilotVariant {
  slug: string;
  title: string;
  summary: string;
  sections: Array<{ id: string; heading?: string; body?: string; items?: string[] }>;
  faq: Array<{ id: string; q: string; a: string }>;
  seo?: { title?: string; description?: string };
}

export interface PilotEntity {
  contentId: string;
  type: ContentType;
  neutral: {
    difficulty?: string;
    datePublished?: string;
    dateModified?: string;
    neutralData?: Record<string, unknown>;
    relationships?: Array<{ rel: string; targetContentId: string; order?: number }>;
  };
  variants: Record<LocaleCode, PilotVariant>;
}

export interface PilotCategory {
  key: string;
  kind: "course_category" | "tool_category" | "role";
  label: Record<LocaleCode, string>;
  slug: Record<LocaleCode, string>;
}

export const PILOT_CATEGORIES: PilotCategory[] = [
  { key: "automation", kind: "tool_category",
    label: { en: "Automation", ms: "Automasi", th: "ระบบอัตโนมัติ", vi: "Tự động hóa" },
    slug: { en: "automation", ms: "automasi", th: "automation", vi: "tu-dong-hoa" } },
  { key: "marketing", kind: "course_category",
    label: { en: "Marketing", ms: "Pemasaran", th: "การตลาด", vi: "Tiếp thị" },
    slug: { en: "marketing", ms: "pemasaran", th: "marketing", vi: "tiep-thi" } },
];

const V = (
  slug: string, title: string, summary: string,
  sectionHeading: string, sectionBody: string,
  q: string, a: string,
): PilotVariant => ({
  slug, title, summary,
  sections: [{ id: "s1", heading: sectionHeading, body: sectionBody }],
  faq: [{ id: "f1", q, a }],
  seo: { title, description: summary },
});

export const PILOT_ENTITIES: PilotEntity[] = [
  // ---- TOOLS ----
  {
    contentId: "tool-flowcast", type: "tool",
    neutral: { dateModified: "2026-08-01", neutralData: { applicationCategory: "AI Tool" }, relationships: [{ rel: "category", targetContentId: "automation" }, { rel: "tutorial", targetContentId: "tut-automate-report" }, { rel: "tutorial", targetContentId: "tut-clean-data" }] },
    variants: {
      en: V("flowcast", "Flowcast", "A no-code automation tool for building repeatable workflows.", "What it does", "Flowcast connects your apps and runs multi-step workflows on a schedule, without writing code.", "Is Flowcast hard to learn?", "No — you start from a template and adjust one step at a time."),
      ms: V("flowcast", "Flowcast", "Alat automasi tanpa kod untuk membina aliran kerja berulang.", "Apa yang ia lakukan", "Flowcast menyambungkan aplikasi anda dan menjalankan aliran kerja berbilang langkah mengikut jadual, tanpa menulis kod.", "Adakah Flowcast sukar dipelajari?", "Tidak — anda mula daripada templat dan laraskan satu langkah pada satu masa."),
      th: V("flowcast", "Flowcast", "เครื่องมืออัตโนมัติแบบไม่ต้องเขียนโค้ดสำหรับสร้างเวิร์กโฟลว์ที่ทำซ้ำได้", "ทำอะไรได้บ้าง", "Flowcast เชื่อมต่อแอปของคุณและเรียกใช้เวิร์กโฟลว์หลายขั้นตอนตามกำหนดเวลา โดยไม่ต้องเขียนโค้ด", "Flowcast เรียนรู้ยากไหม", "ไม่ยาก คุณเริ่มจากเทมเพลตแล้วปรับทีละขั้นตอน"),
      vi: V("flowcast", "Flowcast", "Công cụ tự động hóa không cần lập trình để xây dựng quy trình lặp lại.", "Công cụ này làm gì", "Flowcast kết nối các ứng dụng của bạn và chạy quy trình nhiều bước theo lịch, mà không cần viết mã.", "Flowcast có khó học không?", "Không — bạn bắt đầu từ mẫu và điều chỉnh từng bước một."),
    },
  },
  {
    contentId: "tool-lumina", type: "tool",
    neutral: { dateModified: "2026-08-02", neutralData: { applicationCategory: "AI Tool" }, relationships: [{ rel: "category", targetContentId: "marketing" }] },
    variants: {
      en: V("lumina", "Lumina", "An AI image tool for turning briefs into on-brand visuals.", "What it does", "Lumina generates and edits images from a short text brief, keeping a consistent style across a set.", "Can it match my brand?", "Yes — you save a style once and reuse it across every image."),
      ms: V("lumina", "Lumina", "Alat imej AI untuk menukar ringkasan menjadi visual mengikut jenama.", "Apa yang ia lakukan", "Lumina menjana dan menyunting imej daripada ringkasan teks pendek, mengekalkan gaya yang konsisten merentas satu set.", "Bolehkah ia sepadan dengan jenama saya?", "Ya — anda simpan gaya sekali dan guna semula untuk setiap imej."),
      th: V("lumina", "Lumina", "เครื่องมือสร้างภาพด้วย AI ที่เปลี่ยนบรีฟให้เป็นภาพตรงกับแบรนด์", "ทำอะไรได้บ้าง", "Lumina สร้างและแก้ไขภาพจากบรีฟข้อความสั้น ๆ โดยคงสไตล์ให้สอดคล้องกันทั้งชุด", "ปรับให้ตรงแบรนด์ได้ไหม", "ได้ คุณบันทึกสไตล์ครั้งเดียวแล้วนำไปใช้กับทุกภาพ"),
      vi: V("lumina", "Lumina", "Công cụ ảnh AI biến bản tóm tắt thành hình ảnh đúng thương hiệu.", "Công cụ này làm gì", "Lumina tạo và chỉnh sửa hình ảnh từ một bản tóm tắt ngắn, giữ phong cách nhất quán cho cả bộ.", "Có khớp thương hiệu của tôi không?", "Có — bạn lưu phong cách một lần và dùng lại cho mọi hình ảnh."),
    },
  },
  // ---- TUTORIALS ----
  {
    contentId: "tut-automate-report", type: "tutorial",
    neutral: { difficulty: "beginner", datePublished: "2026-07-10", dateModified: "2026-07-10", relationships: [{ rel: "tool", targetContentId: "tool-flowcast" }, { rel: "related", targetContentId: "tut-clean-data" }, { rel: "category", targetContentId: "automation" }] },
    variants: {
      en: V("automate-a-weekly-report", "Automate a weekly report", "Build a workflow that compiles your numbers into a report every Monday.", "What you'll build", "A scheduled Flowcast workflow that pulls data, formats it, and sends a weekly summary — no manual steps.", "Do I need coding?", "No coding is required; this uses a visual workflow."),
      ms: V("automasikan-laporan-mingguan", "Automasikan laporan mingguan", "Bina aliran kerja yang menyusun nombor anda menjadi laporan setiap Isnin.", "Apa yang anda akan bina", "Aliran kerja Flowcast berjadual yang menarik data, memformatnya, dan menghantar ringkasan mingguan — tanpa langkah manual.", "Perlukah saya tahu koding?", "Tiada koding diperlukan; ini menggunakan aliran kerja visual."),
      th: V("automate-weekly-report", "ทำรายงานประจำสัปดาห์แบบอัตโนมัติ", "สร้างเวิร์กโฟลว์ที่รวบรวมตัวเลขของคุณเป็นรายงานทุกวันจันทร์", "สิ่งที่คุณจะสร้าง", "เวิร์กโฟลว์ Flowcast ตามกำหนดเวลาที่ดึงข้อมูล จัดรูปแบบ และส่งสรุปประจำสัปดาห์ โดยไม่มีขั้นตอนที่ต้องทำเอง", "ต้องเขียนโค้ดไหม", "ไม่ต้องเขียนโค้ด ใช้เวิร์กโฟลว์แบบภาพ"),
      vi: V("tu-dong-hoa-bao-cao-hang-tuan", "Tự động hóa báo cáo hàng tuần", "Xây dựng quy trình tổng hợp số liệu thành báo cáo vào mỗi thứ Hai.", "Bạn sẽ xây dựng gì", "Một quy trình Flowcast theo lịch để lấy dữ liệu, định dạng và gửi bản tóm tắt hàng tuần — không thao tác thủ công.", "Tôi có cần lập trình không?", "Không cần lập trình; quy trình này dùng giao diện trực quan."),
    },
  },
  {
    contentId: "tut-clean-data", type: "tutorial",
    neutral: { difficulty: "beginner", datePublished: "2026-07-12", dateModified: "2026-07-12", relationships: [{ rel: "tool", targetContentId: "tool-flowcast" }, { rel: "category", targetContentId: "automation" }] },
    variants: {
      en: V("clean-messy-data", "Clean messy data", "Turn an inconsistent spreadsheet into a tidy, reliable table.", "The approach", "Standardise columns, remove duplicates, and validate values with a repeatable Flowcast step.", "Will it change my original file?", "No — it writes to a copy, leaving your source untouched."),
      ms: V("bersihkan-data-bersepah", "Bersihkan data bersepah", "Tukar hamparan yang tidak konsisten kepada jadual yang kemas dan boleh dipercayai.", "Pendekatannya", "Seragamkan lajur, buang pendua, dan sahkan nilai dengan langkah Flowcast yang boleh diulang.", "Adakah ia mengubah fail asal saya?", "Tidak — ia menulis ke salinan, membiarkan sumber anda tidak tersentuh."),
      th: V("clean-messy-data", "จัดระเบียบข้อมูลที่ยุ่งเหยิง", "เปลี่ยนสเปรดชีตที่ไม่สม่ำเสมอให้เป็นตารางที่เรียบร้อยและเชื่อถือได้", "แนวทาง", "จัดคอลัมน์ให้เป็นมาตรฐาน ลบรายการซ้ำ และตรวจสอบค่าด้วยขั้นตอน Flowcast ที่ทำซ้ำได้", "จะเปลี่ยนไฟล์ต้นฉบับไหม", "ไม่ ระบบเขียนลงสำเนา ไฟล์ต้นฉบับไม่ถูกแตะต้อง"),
      vi: V("lam-sach-du-lieu-lon-xon", "Làm sạch dữ liệu lộn xộn", "Biến bảng tính thiếu nhất quán thành bảng gọn gàng, đáng tin cậy.", "Cách tiếp cận", "Chuẩn hóa cột, loại bỏ trùng lặp và kiểm tra giá trị bằng một bước Flowcast lặp lại được.", "Có thay đổi tệp gốc không?", "Không — nó ghi ra bản sao, giữ nguyên tệp nguồn."),
    },
  },
  // ---- PROMPT PAGE ----
  {
    contentId: "pp-marketing-prompts", type: "prompt_page",
    neutral: { datePublished: "2026-07-15", relationships: [{ rel: "tool", targetContentId: "tool-lumina" }, { rel: "related", targetContentId: "tut-automate-report" }, { rel: "category", targetContentId: "marketing" }] },
    variants: {
      en: V("marketing-prompts", "Marketing prompts", "Reusable prompts for campaigns, copy, and social posts.", "How to use these", "Copy a prompt, replace the bracketed parts with your product and audience, then refine the result.", "Do these work in any AI tool?", "Yes — they are written to work across common assistants."),
      ms: V("gesaan-pemasaran", "Gesaan pemasaran", "Gesaan boleh guna semula untuk kempen, salinan, dan siaran sosial.", "Cara menggunakannya", "Salin gesaan, gantikan bahagian dalam kurungan dengan produk dan audiens anda, kemudian perhalusi hasilnya.", "Adakah ini berfungsi dalam mana-mana alat AI?", "Ya — ia ditulis untuk berfungsi merentas pembantu biasa."),
      th: V("marketing-prompts", "พรอมป์การตลาด", "พรอมป์ที่นำกลับมาใช้ได้สำหรับแคมเปญ ข้อความ และโพสต์โซเชียล", "วิธีใช้", "คัดลอกพรอมป์ แทนที่ส่วนในวงเล็บด้วยสินค้าและกลุ่มเป้าหมายของคุณ แล้วปรับผลลัพธ์", "ใช้กับเครื่องมือ AI ใดก็ได้ไหม", "ได้ เขียนมาให้ใช้ได้กับผู้ช่วยทั่วไป"),
      vi: V("prompt-tiep-thi", "Prompt tiếp thị", "Các prompt tái sử dụng cho chiến dịch, nội dung và bài đăng mạng xã hội.", "Cách sử dụng", "Sao chép prompt, thay phần trong ngoặc bằng sản phẩm và đối tượng của bạn, rồi tinh chỉnh kết quả.", "Có dùng được với mọi công cụ AI không?", "Có — chúng được viết để hoạt động với các trợ lý phổ biến."),
    },
  },
  // ---- COLLECTION / LEARNING PATH ----
  {
    contentId: "col-getting-started", type: "collection",
    neutral: { difficulty: "beginner", neutralData: { group: "start_here", estTimeMin: 20 }, relationships: [{ rel: "step", targetContentId: "tut-automate-report", order: 1 }, { rel: "step", targetContentId: "tut-clean-data", order: 2 }] },
    variants: {
      en: V("getting-started", "Getting started", "A short path from zero to your first automation.", "What's inside", "Two beginner tutorials, in order, that get you a working automation in about twenty minutes.", "Where should I begin?", "Start at step one and follow them in order."),
      ms: V("mula-di-sini", "Mula di sini", "Laluan pendek dari sifar ke automasi pertama anda.", "Apa yang ada di dalam", "Dua tutorial pemula, mengikut urutan, yang memberi anda automasi berfungsi dalam kira-kira dua puluh minit.", "Di mana saya patut mula?", "Mulakan pada langkah satu dan ikut mengikut urutan."),
      th: V("getting-started", "เริ่มต้นที่นี่", "เส้นทางสั้น ๆ จากศูนย์สู่ระบบอัตโนมัติแรกของคุณ", "มีอะไรบ้าง", "บทเรียนสำหรับผู้เริ่มต้นสองบท เรียงตามลำดับ ที่ทำให้คุณมีระบบอัตโนมัติใช้งานได้ในราวยี่สิบนาที", "ควรเริ่มตรงไหน", "เริ่มที่ขั้นตอนที่หนึ่งและทำตามลำดับ"),
      vi: V("bat-dau", "Bắt đầu", "Lộ trình ngắn từ con số 0 đến tự động hóa đầu tiên của bạn.", "Bên trong có gì", "Hai hướng dẫn cho người mới, theo thứ tự, giúp bạn có một tự động hóa hoạt động trong khoảng hai mươi phút.", "Tôi nên bắt đầu từ đâu?", "Bắt đầu ở bước một và làm theo thứ tự."),
    },
  },
  // ---- COMPARE TOOLS ----
  {
    contentId: "cmp-flowcast-vs-lumina", type: "compare_tools",
    neutral: { relationships: [{ rel: "tool", targetContentId: "tool-flowcast" }, { rel: "tool", targetContentId: "tool-lumina" }] },
    variants: {
      en: V("flowcast-vs-lumina", "Flowcast vs Lumina", "Which one fits your task: automation or images?", "The short answer", "Choose Flowcast to automate repetitive work; choose Lumina to create on-brand visuals. They solve different problems.", "Can I use both?", "Yes — many teams automate with Flowcast and design with Lumina."),
      ms: V("flowcast-lawan-lumina", "Flowcast lawan Lumina", "Yang mana sesuai untuk tugas anda: automasi atau imej?", "Jawapan ringkas", "Pilih Flowcast untuk mengautomasikan kerja berulang; pilih Lumina untuk mencipta visual mengikut jenama. Ia menyelesaikan masalah berbeza.", "Bolehkah saya guna kedua-duanya?", "Ya — banyak pasukan mengautomasi dengan Flowcast dan mereka bentuk dengan Lumina."),
      th: V("flowcast-vs-lumina", "Flowcast กับ Lumina", "อันไหนเหมาะกับงานคุณ: ระบบอัตโนมัติหรือภาพ", "คำตอบสั้น ๆ", "เลือก Flowcast เพื่อทำงานซ้ำ ๆ แบบอัตโนมัติ เลือก Lumina เพื่อสร้างภาพตรงแบรนด์ ทั้งสองแก้ปัญหาต่างกัน", "ใช้ทั้งสองได้ไหม", "ได้ หลายทีมทำงานอัตโนมัติด้วย Flowcast และออกแบบด้วย Lumina"),
      vi: V("flowcast-vs-lumina", "Flowcast và Lumina", "Cái nào hợp với công việc của bạn: tự động hóa hay hình ảnh?", "Câu trả lời ngắn", "Chọn Flowcast để tự động hóa việc lặp lại; chọn Lumina để tạo hình ảnh đúng thương hiệu. Chúng giải quyết vấn đề khác nhau.", "Tôi dùng cả hai được không?", "Được — nhiều nhóm tự động hóa bằng Flowcast và thiết kế bằng Lumina."),
    },
  },
  // ---- FREE TOOL ----
  {
    contentId: "ft-headline-checker", type: "free_tool",
    neutral: { neutralData: { implementationRef: null }, relationships: [{ rel: "category", targetContentId: "marketing" }] },
    variants: {
      en: V("headline-checker", "Headline checker", "Paste a headline and get quick, practical feedback.", "About this tool", "A lightweight utility that scores clarity and length and suggests one improvement. (Interactive logic ships in a later phase.)", "Is it free?", "Yes — free to use, no sign-in."),
      ms: V("penyemak-tajuk", "Penyemak tajuk", "Tampal tajuk dan dapatkan maklum balas ringkas dan praktikal.", "Mengenai alat ini", "Utiliti ringan yang menilai kejelasan dan panjang serta mencadangkan satu penambahbaikan. (Logik interaktif akan disertakan dalam fasa kemudian.)", "Adakah ia percuma?", "Ya — percuma digunakan, tanpa log masuk."),
      th: V("headline-checker", "ตัวตรวจพาดหัว", "วางพาดหัวแล้วรับคำแนะนำที่รวดเร็วและใช้ได้จริง", "เกี่ยวกับเครื่องมือนี้", "ยูทิลิตีขนาดเล็กที่ให้คะแนนความชัดเจนและความยาว พร้อมเสนอการปรับปรุงหนึ่งอย่าง (ตรรกะเชิงโต้ตอบจะมาในเฟสถัดไป)", "ฟรีไหม", "ฟรี ใช้ได้โดยไม่ต้องลงชื่อเข้าใช้"),
      vi: V("kiem-tra-tieu-de", "Kiểm tra tiêu đề", "Dán tiêu đề và nhận phản hồi nhanh, thiết thực.", "Về công cụ này", "Một tiện ích nhẹ chấm điểm độ rõ ràng và độ dài, gợi ý một cải thiện. (Phần tương tác sẽ có ở giai đoạn sau.)", "Có miễn phí không?", "Có — miễn phí, không cần đăng nhập."),
    },
  },
  // ---- ROLE PAGE ----
  {
    contentId: "role-marketers", type: "role_page",
    neutral: { relationships: [{ rel: "featured", targetContentId: "tut-automate-report" }, { rel: "featured", targetContentId: "pp-marketing-prompts" }, { rel: "category", targetContentId: "marketing" }] },
    variants: {
      en: V("marketers", "AI for marketers", "Practical AI for campaigns, content, and reporting.", "Where to start", "Begin with weekly reporting automation, then use the marketing prompts for content.", "Is this for beginners?", "Yes — everything here assumes no prior AI experience."),
      ms: V("pemasar", "AI untuk pemasar", "AI praktikal untuk kempen, kandungan, dan pelaporan.", "Di mana untuk mula", "Mulakan dengan automasi pelaporan mingguan, kemudian guna gesaan pemasaran untuk kandungan.", "Adakah ini untuk pemula?", "Ya — semua di sini menganggap tiada pengalaman AI sebelum ini."),
      th: V("marketers", "AI สำหรับนักการตลาด", "AI ที่ใช้ได้จริงสำหรับแคมเปญ คอนเทนต์ และการทำรายงาน", "เริ่มตรงไหนดี", "เริ่มจากการทำรายงานประจำสัปดาห์แบบอัตโนมัติ แล้วใช้พรอมป์การตลาดสำหรับคอนเทนต์", "เหมาะกับผู้เริ่มต้นไหม", "เหมาะ ทุกอย่างที่นี่ไม่ต้องมีประสบการณ์ AI มาก่อน"),
      vi: V("marketers", "AI cho người làm tiếp thị", "AI thiết thực cho chiến dịch, nội dung và báo cáo.", "Bắt đầu từ đâu", "Bắt đầu với tự động hóa báo cáo hàng tuần, rồi dùng các prompt tiếp thị cho nội dung.", "Có dành cho người mới không?", "Có — mọi thứ ở đây không đòi hỏi kinh nghiệm AI trước đó."),
    },
  },
  // ---- COMMUNITY (read-only showcase) ----
  {
    contentId: "comm-weekly-report", type: "community_post",
    neutral: { neutralData: { author: "A. Rahman", timeSaved: "2h/week" }, relationships: [{ rel: "related", targetContentId: "tut-automate-report" }] },
    variants: {
      en: V("my-weekly-report-workflow", "My weekly report workflow", "How I stopped rebuilding the same report every Monday.", "What I did", "I set up one automation to gather the numbers and format them, and now the report is ready before I arrive.", "Was it hard to set up?", "It took an afternoon once; it has saved time every week since."),
      ms: V("aliran-kerja-laporan-mingguan-saya", "Aliran kerja laporan mingguan saya", "Bagaimana saya berhenti membina semula laporan yang sama setiap Isnin.", "Apa yang saya buat", "Saya sediakan satu automasi untuk mengumpul nombor dan memformatnya, dan kini laporan sudah siap sebelum saya tiba.", "Adakah ia sukar disediakan?", "Ia mengambil satu petang sekali sahaja; sejak itu ia menjimatkan masa setiap minggu."),
      th: V("my-weekly-report-workflow", "เวิร์กโฟลว์รายงานประจำสัปดาห์ของฉัน", "ฉันเลิกสร้างรายงานเดิมซ้ำทุกวันจันทร์ได้อย่างไร", "สิ่งที่ฉันทำ", "ฉันตั้งค่าระบบอัตโนมัติหนึ่งชุดให้รวบรวมตัวเลขและจัดรูปแบบ ตอนนี้รายงานพร้อมก่อนฉันมาถึง", "ตั้งค่ายากไหม", "ใช้เวลาบ่ายเดียวครั้งเดียว หลังจากนั้นประหยัดเวลาทุกสัปดาห์"),
      vi: V("quy-trinh-bao-cao-hang-tuan-cua-toi", "Quy trình báo cáo hàng tuần của tôi", "Cách tôi ngừng dựng lại cùng một báo cáo mỗi thứ Hai.", "Tôi đã làm gì", "Tôi thiết lập một tự động hóa để thu thập số liệu và định dạng, giờ báo cáo đã sẵn sàng trước khi tôi đến.", "Thiết lập có khó không?", "Chỉ mất một buổi chiều; từ đó tiết kiệm thời gian mỗi tuần."),
    },
  },
];
