# Phase 3 — Malaysian-Malay Review Package (AC14)

> Hand this to a NATIVE Malaysian-Malay reviewer. The MS variant below is
> **NOT public**. It becomes publishable ONLY after a native reviewer approves,
> and only via the approved->published transition. Do not approve on "looks fine".

- contentId: **phase3-ms-demo**  |  locale: **ms**  |  status: **in_review**
- reviewable now: **True**  |  stale: False  |  source v1 / translated-from v1
- automated QA before human review: P0 0 · P1 0 · P2 0 · verdict review

## Field-by-field (English -> Malay)

### `title`  (translate)
- **EN:** Write Better AI Prompts: A Beginner Tutorial
- **MS:** Menulis Gesaan AI yang Lebih Baik: Tutorial untuk Pemula

### `summary`  (translate)
- **EN:** Learn how to write a good prompt step-by-step. This free tutorial takes about 10 minutes and covers 3 core techniques used by over 5000 teams.
- **MS:** Belajar cara menulis gesaan yang baik langkah demi langkah. Tutorial percuma ini mengambil masa kira-kira 10 minit dan merangkumi 3 teknik teras yang digunakan oleh lebih 5000 pasukan.

### `seoTitle`  (localize)
- **EN:** Write Better AI Prompts: A Beginner Tutorial
- **MS:** Menulis Gesaan AI yang Lebih Baik untuk Pemula

### `seoDescription`  (translate)
- **EN:** Learn to write better AI prompts step by step in this free beginner tutorial.
- **MS:** Belajar menulis gesaan AI langkah demi langkah dalam tutorial percuma ini.

### `sec0_heading`  (translate)
- **EN:** Why prompts matter
- **MS:** Mengapa gesaan penting

### `sec0_body`  (translate)
- **EN:** A prompt is the instruction you give an AI tool like ChatGPT. A clear prompt can improve your results by 40 percent. Start with a specific goal, then add context.
- **MS:** Gesaan ialah arahan yang anda berikan kepada alat AI seperti ChatGPT. Gesaan yang jelas boleh meningkatkan hasil anda sebanyak 40 peratus. Mulakan dengan matlamat khusus, kemudian tambah konteks.

### `sec1_heading`  (translate)
- **EN:** Three techniques
- **MS:** Tiga teknik

### `sec1_body`  (translate)
- **EN:** First, give the model a role. Second, show one example. Third, ask for a specific format. These 3 steps work for most tasks and take under 5 minutes to apply.
- **MS:** Pertama, berikan model satu peranan. Kedua, tunjukkan satu contoh. Ketiga, minta format tertentu. 3 langkah ini berkesan untuk kebanyakan tugas dan mengambil masa kurang 5 minit.

### `faq_q0`  (translate)
- **EN:** Is this tutorial free?
- **MS:** Adakah tutorial ini percuma?

### `faq_a0`  (translate)
- **EN:** Yes, this tutorial is completely free to read.
- **MS:** Ya, tutorial ini percuma sepenuhnya untuk dibaca.

## Reviewer checklist
- [ ] Is the Malay natural, idiomatic Bahasa Melayu (Malaysia) — NOT Indonesian?
- [ ] Is meaning preserved (no omission, addition, or changed claim strength)?
- [ ] Are all numbers, dates, product names (ChatGPT, etc.) and URLs correct?
- [ ] Is terminology consistent (e.g. prompt→gesaan) across the whole article?
- [ ] Are the title and SEO description accurate and not machine-stilted?
- [ ] Any factual or tone problem that must block publication?

## Record the decision (auditable; reviewer identity + notes REQUIRED)

```
APPROVE (only if status=in_review and QA P0=0):
  GET /launch/review?contentId=phase3-ms-demo&locale=ms&action=record&decision=approve&reviewer=<name>&notes=<verdict>
REJECT (holds MS out of publication, audited):
  GET /launch/review?contentId=phase3-ms-demo&locale=ms&action=record&decision=reject&reviewer=<name>&notes=<reason>
```

Approve routes through `approveVariant`->`canApprove` (QA never bypassed); publishing
still requires a separate approved->published step. Rejection returns MS to a
non-public state and writes an activity-log entry.

_Generated 2026-09-08. NOTE: this demo MS is a fixture (Gemini quota exhausted at generation time); a real launch feeds Gemini MS output through this same package._
