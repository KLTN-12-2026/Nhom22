---
name: ui-mockup
description: Build HTML/CSS/JS mockup pages for VocabLearning screens in mockups/<phase>/, wired to the real backend API. Use right after a backend step whose endpoints feed a screen (e.g. after /be-code B1.1 → UI01 Đăng ký), or when the user says "tạo mockup", "làm giao diện mẫu", "demo giao diện", "code giao diện cho …". The mockup is the visual source of truth that FE copies into Next.js.
argument-hint: "<roadmap step (B1.1) | UI id (UI01) | FE step (F1.1) | phase (dot1)>"
---

# ui-mockup — screen mockups tied to real API

## Step 1 — Scope (read little)
1. Run the `ui-brief` skill (loads requirements + tokens), unless it already ran this session.
2. Map the argument to screens:
   - `roadmap/ROADMAP_FE.md` gives the F-step, UI ID, Vietnamese route and APIs;
   - the backend step in `roadmap/ROADMAP_BE.md` is the source of the data.
   - Grep `docs/PHAN_TICH_THIET_KE_HE_THONG_HOC_TU_VUNG_K28.md` §10 (screens) and §6 (flows) for the screen. Read only the matching section.
3. Data contract, in this order of preference:
   - the phase report `report/<PHASE>_BAO_CAO_FE.md`;
   - the controller + DTO records;
   - TK §13 (mark "dự kiến").
   Use real field names and real validation limits.
4. Look at existing `mockups/shared/*` first. Reuse classes; add a new shared component only when a pattern appears on 2+ screens.

## Step 2 — Build
- File: `mockups/<phase>/<route-slug>.html` where phase is `gd0`, `dot1`, `dot2` or `dot3`, and the slug is the Vietnamese route (e.g. `dang-ky.html`, `bo-the-chi-tiet.html`).
- Start from an existing page (fonts, 3 CSS files, `app.js`, `viewport-fit=cover`). **Design two layouts** (brief §4.0, breakpoint 1024 px):
  - Learner pages: copy the shell of `mockups/gd0/bo-cuc.html` — `.app` + `.app-header` + `.sidebar` (desktop) **and** `.bottom-nav` (mobile, set `aria-current` on the matching item). Desktop content uses columns (main + 320 px side column) where it helps; mobile stacks the most important action first.
  - Auth pages (đăng ký, đăng nhập, xác thực, quên mật khẩu): copy `mockups/dot1/dang-ky.html` — `.auth` > `.auth-aside` (desktop brand panel) + `.auth-main` > `.auth-form` (mobile shows its own `.brand`).
  - Sticky/fixed page elements must sit above `.bottom-nav` below 1024 px.
- Colors: blue `.btn-primary` for normal main actions; `.btn-accent` (orange) only for the one learning CTA of the screen; green only through `.progress` / success states.
- `<body data-states="loading empty error success live">`. Implement each state; `live` calls the real API through `VL.api()` (GET).
  - For writes, the mockup posts to the API only when it is safe and idempotent in dev. Otherwise simulate the success/error from the report examples.
- Use the real error `code`s:
  - `fieldErrors` → `.field[data-invalid]` + `.field-error` under the field;
  - `429` → countdown on the button;
  - `401` → redirect note.
- Brand: `<a class="brand"><img class="brand-mark" src="../shared/assets/logo-mark.svg" alt="" width="28" height="28"><span>Vocab<span class="brand-accent">Learning</span></span></a>`; on the dark auth panel use `logo-mark-inverse.svg`. Head has `<link rel="icon" href="../shared/assets/favicon.svg">`.
- Images: never invent or download pictures. Where a screen needs one, put an `.img-slot` (see `components.css`) with `data-src="../shared/assets/images/<name>.webp"`, a fixed `aspect-ratio`, and a `figcaption`: title, file name + size, and what the picture should show. Add a row to `mockups/shared/assets/README.md`. The user adds the file later; `app.js` swaps it in automatically. Only where an image helps understanding.
- Content: realistic Vietnamese/English vocabulary. Include at least one long-data case per list/form (GT07).
- Static demo site (no backend): load `../shared/demo.js` before `app.js`; learner pages use `<body data-nav="<key>" data-auth="required">` with empty `.app-header`/`.sidebar`/`.bottom-nav` (app.js fills them); add Đợt 1 endpoints to `routes` in `shared/demo.js`, sample learning data via `VLDemo`; use `VL.put` for uploads; every link points to a real page (no `href="#"`).
- Page-specific CSS goes in a `<style>` block in the page, token-based. Move it to `components.css` once a second page needs it.
- Accessibility:
  - labels bound to inputs;
  - `aria-invalid` and `aria-describedby` on errors;
  - `aria-live` for async results;
  - keyboard reachable;
  - one `h1`.
- Comment at the top of `<body>`: the API(s) used and the FE step/UI ID.

## Step 3 — Register and check
1. `mockups/index.html`: add or activate the row (link, F-step badge, one-line description). Change the phase badge when all its screens exist.
2. Self-check the `ui-brief` checklist.
3. If the browser pane is available, open the page (served on port 5173) and take **one** screenshot at 1280 px (desktop layout: sidebar/split visible) and **one** at 390 px (bottom nav / single column). Check `scrollWidth === innerWidth` at 390. Fix visible issues. No more screenshots than that.

## Step 4 — Report (only this)
```
**Mockup:** <n> trang — <list of mockups/... paths>
| Trang | UI | API | Trạng thái có |
|---|---|---|---|
**Thành phần dùng chung mới:** <list or "không">
**FE dựng bằng:** /fe-from-mockup <path>
```

## Do not
- Do not copy the mockup toolbar (`.mock-bar`) into product code or docs as a feature.
- Do not introduce colors, fonts, shadows or animations outside `tokens.css`.
- Do not build screens whose API does not exist and has no contract in the report or TK §13. Say so in one line.
