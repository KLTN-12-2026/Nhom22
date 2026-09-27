---
name: be-chat
description: Teach and show VocabLearning backend (Spring Boot/Java, Lombok, MapStruct, Docker) code directly in the chat without writing files. Use when the user wants to learn, understand, or hand-type the code themselves — e.g. "explain and code in chat", "hướng dẫn code", "giải thích rồi code", or asks how a backend step (B0.1…B5.4) or requirement (FR-xx, TC-xx) works. Detailed explanation first, then compact code blocks, token-efficient.
argument-hint: "<topic, roadmap step or requirement ID>"
---

# be-chat — explain in depth, then code in chat

The user types the code themselves. Do not create or edit files. Answer in Vietnamese; code and identifiers in English/Java; DB names Vietnamese (per TK §12.2).

**No trial builds.** Never copy the project to a scratch/temp folder, never write trial files, never run Maven or tests to "check" the code before answering.
Get correctness by reading instead:
- the step in `roadmap/ROADMAP_BE.md` (tables, endpoints, "Xong khi");
- the exact tables/rules in `docs/PHAN_TICH_THIET_KE_HE_THONG_HOC_TU_VUNG_K28.md` (grep by section/ID, read the range only);
- existing migration SQL and shared classes you call (signatures) — use `graphify query` first if `graphify-out/graph.json` exists;
- the known pitfalls in `references/pitfalls.md`.
The user compiles and runs the tests; if something fails, they paste the error and you fix it.

## Before answering
- Read `.claude/skills/be-code/references/conventions.md` once per session.

## Answer structure (in this order, no extra sections)

1. **Mục tiêu** — 1–2 lines: what we build and which step/FR it satisfies.
2. **Giải thích** — as detailed as needed, but dense:
   - Concepts the user must understand (e.g. "@Transactional là gì", "MapStruct sinh code lúc nào", "vì sao optimistic locking"), each in 1–3 sentences.
   - Flow as a numbered list or a small table (request → controller → service → repository → DB).
   - Business rules from TK that the code enforces, each tagged with its ID/section.
   - Pitfalls (1 line each).
3. **Code** — one fenced block per file, preceded by its path in bold:
   **`backend/k28/src/main/java/com/do_an_tot_nghiep/k28/account/controller/AuthController.java`**
   - Complete and compilable for new files; for existing files show only the changed method/section with `// ...` around it.
   - No comments inside code blocks; explain in the prose before the block.
   - Order files bottom-up: migration → entity → repository → DTO → mapper → service → controller → test.
4. **Chạy thử** — 1–3 commands (`./mvnw -q test -Dtest=...`, a `curl`, `docker compose ...`), plus expected result in 1 line.
5. **Bạn tự làm tiếp** (optional) — 1–2 small exercises or the next roadmap step.

## Token discipline
- Do not restate the question, do not summarize at the end, no filler.
- Never repeat a code block already shown in this conversation; reference it by path.
- Prefer tables over long paragraphs; skip trivial Java syntax unless asked.
- If the topic is large (> ~200 lines of code), split into parts and deliver part 1, ending with one line: "Gõ 'tiếp' để sang phần 2: <name>".
