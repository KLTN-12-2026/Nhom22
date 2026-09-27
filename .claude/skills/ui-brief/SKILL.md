---
name: ui-brief
description: Load the VocabLearning UI requirements (palette, type, layout, motion, acceptance criteria GT01–GT12) before any UI work — mockups, Next.js pages, components, CSS, design review. Use whenever a task touches visual design or front-end markup/styling for this project, or the user says "yêu cầu giao diện", "nạp yêu cầu UI", "thiết kế giao diện". Other UI skills (ui-mockup, fe-from-mockup) call this first.
---

# ui-brief — load the design brief (once per session)

1. Read `frontend/design/YEU_CAU_GIAO_DIEN.md` fully (it is small). **It wins over every other design opinion**, including `frontend-design`.
2. Read `mockups/shared/tokens.css`. Never hard-code a color, size, radius or duration that has a token.
3. Read `.claude/skills/frontend-design/SKILL.md` for craft rules. Apply only where the brief leaves freedom: copywriting, avoiding template tells, restraint.
4. Keep this checklist in mind and self-check every screen before finishing:

| ID | Must hold |
|---|---|
| GT01 | 60–30–10: neutral surfaces; blue `--primary` = main actions, links, selected nav; green `--secondary` = progress/completion only (never buttons); orange `--accent` (`.btn-accent`, dark text) = at most **one** learning CTA per screen ("Bắt đầu học", "Làm bài") + tiny highlights (`--accent-bg`/`--accent-text`) |
| GT02–03 | Contrast ≥ 4.5:1 for body text, ≥ 3:1 for large text, controls and focus ring; visible `:focus-visible` |
| GT04 | Quên–Khó–Nhớ–Dễ: this order, same size and weight, text labels, keys 1–4 |
| GT05 | Study screen: the word is the focus; no XP, AI promo or charts; meaning hidden until the card is flipped |
| GT06 | No purple–blue gradient, glass blur, glow, repeated stat-card grids, emoji nav, ALL-CAPS eyebrows |
| GT07 | Test with long data: a 150-character deck name, a long word, a multi-line meaning, Vietnamese diacritics, missing image/audio |
| GT08 | **Two layouts, breakpoint 1024 px.** Desktop: header + left sidebar, multi-column content (main + 320 px side column), auth pages split 2 columns (brand panel `--primary-strong` + form ≤ 420 px). < 1024 px: top bar + bottom nav (5 items: Học, Thư viện, Luyện tập, Sổ tay, Tôi), one column, auth = single column without brand panel; study session hides the bottom nav. No horizontal scroll at 360/390; taps ≥ 44 px (48 for primary); fixed bars never cover content |
| GT09/11 | Durations from the tokens; animate only `opacity`/`transform`; `prefers-reduced-motion` removes flip and slide |
| GT10 | Buttons disable while a request is pending; progress moves only after the server confirms |
| GT12 | Every screen has loading, empty, error (with `traceId`) and success states |

5. Copy rules (Vietnamese UI):
   - sentence case, short plain verbs;
   - a button says exactly what it does ("Lưu thẻ", not "Gửi"), and the toast reuses that verb ("Đã lưu thẻ");
   - an error says what happened and what to do next;
   - no "→" appended to buttons, no "A · B · C" meta strings.
