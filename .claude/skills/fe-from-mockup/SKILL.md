---
name: fe-from-mockup
description: Implement VocabLearning Next.js (JavaScript, App Router) pages and components that look and behave exactly like the HTML mockups in mockups/. Use when the FE side codes a screen ("code FE", "dựng trang Next.js", "làm giống mockup", "chuyển mockup sang React") or sets up the FE UI foundation (tokens, fonts, UI kit). Recommends and wires the UI libraries.
argument-hint: "<mockup path, e.g. mockups/gd0/ui-kit.html | UI id | F-step>"
---

# fe-from-mockup — pixel-faithful Next.js from the mockup

The mockup is the **visual contract**. Same layout, spacing, tokens, copy, states, keyboard behavior and motion.
Data comes from the real API through `src/lib/api-client.js` (contract in `report/*_BAO_CAO_FE.md`).

## Step 0 — Foundation (only once; check `frontend/package.json` first)

Recommended stack (small, accessible, fits the brief). Say in one line which packages you add and why:

| Need | Library | Why |
|---|---|---|
| Styling | `tailwindcss` v4 (`@tailwindcss/postcss`) | Tokens become utilities through `@theme`; no runtime cost |
| Variants | `class-variance-authority`, `clsx`, `tailwind-merge` | `<Button variant size>` mirrors `.btn-*` classes cleanly |
| Icons | `lucide-react` | Same icon names as `mockups/shared/app.js` (stroke 1.75, size 20) |
| Accessible primitives | `@radix-ui/react-dialog`, `@radix-ui/react-checkbox`, `@radix-ui/react-switch`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-tooltip` | Focus trap, Esc, ARIA done right; unstyled, so the mockup CSS rules apply |
| Toast | `sonner` | Tiny, `aria-live`; style it with tokens |
| Font | `next/font/google` → `Be_Vietnam_Pro` (400/500/600, subsets `latin`, `vietnamese`) | Self-hosted at build time, no layout shift |
| Forms / data | `react-hook-form`, `zod`, `@hookform/resolvers`, `@tanstack/react-query` | Already in ROADMAP_FE |
| Motion | CSS only (as in the mockup) | Add `motion` only if card transitions get complex; never spring/bounce |

Map tokens once:
1. Copy `mockups/shared/tokens.css` into `src/app/tokens.css`.
2. In `globals.css`: `@import "tailwindcss"; @import "./tokens.css";`, then `@theme inline` that maps the variables. For example:
   - `--color-primary: var(--primary)`, `--color-bg: var(--bg)`
   - `--radius-card: var(--r-card)`
   - `--ease-out-soft: var(--ease)`
   - `--font-sans: var(--font-be-vietnam), "Segoe UI", system-ui`
3. Port `base.css` and `components.css` rules either as component classes (`@layer components`) or as Tailwind utilities inside the components. Keep the numbers identical.

## Step 1 — Read the mockup
1. Run the `ui-brief` skill once per session.
2. Read the mockup HTML plus the used rules in `mockups/shared/components.css` and `app.js`. Note:
   - the structure and the class → component mapping;
   - every state (`data-states`) and the copy text;
   - keyboard handling (e.g. Space to flip, keys 1–4);
   - `aria-*` attributes;
   - the layout breakpoints (1024 px desktop ↔ mobile shell, 640 px table stack, 520 px 2×2 rating).

## Step 2 — Build (JavaScript, no TypeScript)

| Mockup | Next.js |
|---|---|
| `.btn .btn-primary/.btn-secondary/.btn-ghost/.btn-danger .btn-lg .btn-icon`, `aria-busy` | `components/ui/Button.jsx` (cva variants + `loading` prop) |
| `.field` + `.input/.select/.textarea` + `.field-error` | `components/ui/Field.jsx`, `Input.jsx`, `Select.jsx`, `Textarea.jsx` (RHF `register`, `aria-invalid`, `aria-describedby`) |
| `.check`, `.switch` | Radix Checkbox / Switch styled with the same rules |
| `.badge-*`, `.alert-*`, `.panel` | `Badge.jsx`, `Alert.jsx`, `Panel.jsx` |
| `.table` (stack < 640 px) + `.pagination` | `DataTable.jsx`, `Pagination.jsx` (0-based `page`, max `size` 100) |
| `.brand` + `assets/logo-*.svg`, `favicon.svg` | Copy `mockups/shared/assets/` → `frontend/public/`; `components/layout/Brand.jsx` (`inverse` prop); `app/icon.svg` = favicon |
| `.img-slot[data-src]` | `next/image` with the same `aspect-ratio` and `alt`; if the file is still missing in `public/images`, render the same dashed placeholder (dev only) — never ship the placeholder text |
| `.skeleton`, `.state`, `.state-error` + `traceId` | `Skeleton.jsx`, `EmptyState.jsx`, `ErrorState.jsx` (takes `ApiError`) |
| `.dialog-scrim/.dialog` | Radix Dialog with the same durations/transform |
| toasts | `sonner` `<Toaster>` in the root layout |
| app shell (`.app`, `.app-header`, `.sidebar`, `.bottom-nav`) | `app/(learner)/layout.jsx` + `components/layout/AppHeader.jsx`, `Sidebar.jsx` (`hidden lg:flex`), `BottomNav.jsx` (`lg:hidden`, fixed, `pb-[env(safe-area-inset-bottom)]`); main gets bottom padding below `lg`; active link = `aria-current="page"` via `usePathname` |
| auth layout (`.auth`, `.auth-aside`, `.auth-main`, `.auth-form`) | `app/(auth)/layout.jsx`: `grid lg:grid-cols-[5fr_7fr]`; aside `hidden lg:flex`; mobile logo `lg:hidden` |
| `.btn-accent`, `.badge-accent`, `.streak`, `.progress` (green) | `Button variant="accent"` (dark text), `Badge variant="accent"`, `StreakChip.jsx`, `Progress.jsx` using `--secondary` |
| `.rating`, `.card` (flip) | `RatingGroup.jsx`, `StudyCard.jsx`; keys 1–4 and Space; disable during mutation |

- Routes: the Vietnamese paths from ROADMAP_FE (`/dang-ky`, `/hoc`…). The `/_ui` page is dev-only.
- Breakpoint: Tailwind `lg` (1024 px) = the mockup's desktop/mobile switch. Build both layouts; never ship only the stretched desktop one.
- States come from TanStack Query:
  - `isPending` → skeleton;
  - an empty array → EmptyState;
  - `ApiError` → ErrorState or field errors;
  - data → success.
  The mockup toolbar is **not** built.
- Copy text exactly as in the mockup, unless the report/API gives better real data.

## Step 3 — Verify visually
1. Run `npm run dev` and `npx serve mockups -l 5173`.
2. With the browser pane, screenshot the mockup and the Next.js page at 1280 px and at 390 px, same state. Fix differences in spacing, sizes and colors.
3. Check keyboard: Tab order, focus ring, Esc closes dialogs.
4. Check reduced motion (emulate).
5. Run lint and the tests of the touched feature.

## Step 4 — Report (only this)
```
**Kết quả:** <page(s)> giống mockup ở 1280/390 px; <tests/lint status>
| File | Vai trò |
|---|---|
**Thư viện thêm:** <list or "không">
**Khác mockup (có lý do):** <list or "không">
```
