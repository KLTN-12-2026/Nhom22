---
name: fe-report
description: Write the backend→frontend handoff report after a VocabLearning backend phase (GĐ0, Đợt 1, Đợt 2, Đợt 3, GĐ4, GĐ5) or a finished group of steps. Use when the user says "viết báo cáo cho FE", "báo cáo giai đoạn", "bàn giao FE", "handoff report", or right after the last step of a phase in roadmap/ROADMAP_BE.md is ticked. Produces report/<PHASE>_BAO_CAO_FE.md that lets a FE developer code the screens without asking BE.
argument-hint: "<phase: GD0 | DOT1 | DOT2 | DOT3 | GD4 | GD5> [optional step range, e.g. B1.1-B1.10]"
---

# fe-report — BE phase handoff report for the FE team

Output: one Markdown file `report/<PHASE>_BAO_CAO_FE.md` in **Vietnamese** (code, JSON, identifiers in English), plus an updated `report/README.md` index.
Goal: a FE developer reads only this file and can build every screen of the matching FE phase — every API is documented with **real, verified** request/response examples, mapped to FE roadmap steps and UI screens.

## Step 1 — Collect facts (read only what is needed)

1. **Phase scope**
   - BE steps of the phase: the section in `roadmap/ROADMAP_BE.md`; list which checkboxes/steps are done.
   - Matching FE steps: the same phase in `roadmap/ROADMAP_FE.md` (F-steps, UI IDs, Vietnamese routes).
2. **What is really implemented** (source of truth = code, not the roadmap):
   - `grep -rn "@\(Get\|Post\|Put\|Patch\|Delete\|Request\)Mapping" backend/src/main/java` → endpoint list.
   - For each endpoint:
     - Read its controller method.
     - Read the request/response DTO records (field names, types, Bean Validation limits such as `@Size`, `@Min`).
     - Grep the service for `ApiException(ErrorCode.` to list the error codes it can return.
   - Security rules: `shared/security/SecurityConfig.java` (public vs authenticated vs ADMIN).
   - New error codes: `shared/errors/ErrorCode.java`.
   - Rate limits: `RateLimiter.Policy`.
   - New migrations in `db/migration/`, only for seed data FE can show (enum values, demo content).
3. **Previous report**: read `report/README.md` and the last `report/*_BAO_CAO_FE.md`.
   - Do not repeat the shared contract (errors, CSRF, paging); link it instead.
   - Only document **changes** to it.
4. Design references, only for what the code lacks (e.g. planned next-phase APIs): grep `docs/PHAN_TICH_THIET_KE_HE_THONG_HOC_TU_VUNG_K28.md` §13 (API) and §10 (screens). Never read whole docs.

## Step 2 — Verify against the running backend (mandatory)

- Make sure the API runs. If `curl -s localhost:8080/actuator/health` fails, run `docker compose --profile app up -d --build` in `backend/` and wait until it is healthy.
- For every documented endpoint, capture a **real** response with `curl -s -i` for:
  - the happy path;
  - one validation error;
  - one auth/permission error.
- Authenticated flows:
  - Get CSRF with a cookie jar: `curl -c jar -b jar .../auth/csrf`.
  - Register → read the verify link from Mailpit (`GET http://localhost:8025/api/v1/messages`) → verify → login with the same jar.
- Put only the relevant headers in the report (status, `ETag`, `Location`, `Set-Cookie` names).
- Shorten long arrays and say so ("rút gọn").
- Never invent fields. Label anything not verified as **"dự kiến"** and state its source (TK §x).
- Never run destructive commands (no DROP/DELETE of real data, no `down -v`) to produce examples.
- If an endpoint cannot be verified, say so in section 10 of the report.

## Step 3 — Write the report

Use `references/template.md` exactly (same section order and headings). Rules:

- **Section 1** is the cross-check table BE step ↔ result ↔ FE step ↔ what FE must do. Include what is **not** delivered yet.
- **One subsection per endpoint** with:
  - method + path, permission (G/L/O/A), FE step + UI ID + Vietnamese route;
  - request table (field, type, required, limits, example);
  - real response JSON;
  - error table (HTTP, `code`, when, FE behavior);
  - side effects (cookies, emails in Mailpit, background jobs, 202 polling).
- Give **copy-ready FE code** only where it saves real work:
  - Zod schema mirroring the BE limits;
  - TanStack Query hook (`queryKey`, invalidation after mutations);
  - MSW handler with the real response.
  - Keep each snippet short, JavaScript only, and consistent with `src/lib/api-client.js` from the GĐ0 report.
- Map validation limits 1:1 from the DTO annotations. FE Zod limits must equal BE limits.
- Include a **flow diagram** (mermaid sequence) for multi-step flows such as register → verify → login, upload-intent → PUT → complete, or CSV import → preview → commit.
- **"Sắp có" section**: planned APIs of the next phase with dates from the roadmaps and draft contracts marked "dự kiến", so FE can mock ahead.
- **Mockups**: for each screen, link its `mockups/<phase>/*.html`. If a screen has no mockup yet, run the `ui-mockup` skill first. FE builds with `/fe-from-mockup`.
- **Checklist** of FE done-criteria for the phase, copied and sharpened from `ROADMAP_FE.md`.
- Tables over prose. No filler. Vietnamese prose, English code.

## Step 4 — Finish

1. Update `report/README.md`: add or refresh one row (phase, date, file link, status).
2. Answer in chat with only this:

   ```
   **Báo cáo:** report/<PHASE>_BAO_CAO_FE.md — <n> API đã kiểm chứng, <m> API dự kiến
   **Chưa kiểm chứng:** <list or "không">
   **Gửi FE:** <1 line on what FE should start with>
   ```

## Do not
- Do not paste the report into chat.
- Do not document endpoints that do not exist in the code as available.
- Do not change backend code while writing the report. If you find a bug or an inconsistency between code and docs, list it in section 10 ("Lưu ý") and tell the user in one line.
