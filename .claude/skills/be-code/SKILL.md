---
name: be-code
description: Implement VocabLearning backend (Spring Boot + Lombok + MapStruct + Docker) features by writing real files into backend/. Use when the user asks to code, build, implement or fix a backend step, endpoint, entity, migration, requirement ID (FR-01…FR-14, TC-01…TC-20) or a roadmap step (B0.1, B1.3, B2.4…). Writes code, verifies it compiles/tests, then lists changed files and stops.
argument-hint: "<roadmap step or requirement ID, e.g. B1.1 or FR-06>"
---

# be-code — write runnable backend code into files

Goal: smallest correct code that compiles and passes tests, following the project conventions. Minimal talk.

## Steps

1. **Scope** — Map the request to a step in `roadmap/ROADMAP_BE.md` (FR/TC IDs, tables, endpoints, "Xong khi"). Read only what is needed:
   - `references/conventions.md` (this skill) — always, once per session.
   - If `graphify-out/graph.json` exists: `graphify query "<step topic>"` to find related code first.
   - Grep the design doc by section, never read it whole: `grep -n "FR-06\|### 7\." docs/PHAN_TICH_THIET_KE_HE_THONG_HOC_TU_VUNG_K28.md`, then read that range (tables §12.2/§12.4, API §13, rules §6–§8, §14–§16).
   - Read existing files you will modify; do not re-read files already in context.
   If a prerequisite step is missing (e.g. B0.4 errors before a controller), build the minimal prerequisite first and say so in one line.

2. **Explain (≤ 5 lines, Vietnamese)** — what is being built, which module/layer, and the key rule(s) from TK.

3. **Code**
   - Follow `references/conventions.md` exactly (module layout, Vietnamese DB names ↔ camelCase entities, Lombok, MapStruct mappers, error format, ownership check, UTC + Clock).
   - Schema changes only in a new Flyway `V<n>__*.sql` (next free number); never edit an applied migration.
   - Optimal length: no dead code, no speculative abstractions.
   - **No comments at all** in any code/config file (Java, SQL, YAML, XML, Dockerfile, compose, .env.example). Put explanations in docs/README instead.
   - Add or update the test for the step (`FRxx...Test`, methods `tcNN_...`) when behavior is added.

4. **Verify** in the real `backend/k28/` only; never copy the project to a scratch/temp folder:
   - `./mvnw -q -DskipTests compile` must pass.
   - Related tests: `./mvnw -q test -Dtest=<TestClass>`. In Claude's shell prefix `JAVA_TOOL_OPTIONS='-Djdk.net.unixdomain.tmpdir=C:\Users\Public'`, else Netty/Redis fails with "Unable to establish loopback connection".
   - Docker steps (B0.2, B5.1): `docker compose config` and `docker compose up -d`, then check health.
   - Pitfalls: `.claude/skills/be-chat/references/pitfalls.md`.
   - If Docker/Testcontainers is unavailable, run unit tests only and state that integration tests were not run.
   - Fix failures before reporting. Never claim success without a passing command.

4a. **Graph** — after the step compiles, run `graphify update .` from the repo root (code only, no LLM) if `graphify-out/` exists.

4b. **Optional follow-ups** (only when present/asked): `ui-mockup` if `mockups/` exists and the step feeds a screen; `postman-sync` if `postman/postman.json` exists and endpoints changed. One report line each.

5. **Report and stop** — output exactly this, nothing else:

   ```
   **Kết quả:** <1 line: compiled / tests passed (n) / what was not run>

   | File | Vai trò |
   |---|---|
   | backend/k28/src/.../X.java | <what it does, ≤ 12 words> |

   **Tiếp theo:** <next roadmap step, 1 line>
   ```
   Then tick the step's checkbox `[x]` in `roadmap/ROADMAP_BE.md` when the whole step is done.
   If that was the **last step of a phase** (GĐ0, Đợt 1/2/3, GĐ4, GĐ5), make the `Tiếp theo` line:
   `Chạy /fe-report <PHASE> để bàn giao cho FE`. End the turn.

## Do not
- Do not paste the written code back into chat.
- Do not refactor unrelated code or add features outside the requested step.
- Do not add dependencies without saying which and why (1 line).
- Do not use `ddl-auto=update`.
- Do not commit `.env` or real keys; `.env.example` holds names and dev dummies only.
