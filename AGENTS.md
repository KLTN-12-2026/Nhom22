# VocabLearning — project guide for Codex

Vocabulary-learning website: `backend/` Spring Boot 4 (Java 21, MySQL 8.4, Redis, RustFS/S3, Lombok, MapStruct, Docker Compose) · `frontend/` Next.js (JavaScript, Vietnamese routes).
Spec: `docs/PHAN_TICH_THIET_KE_HE_THONG_HOC_TU_VUNG_K28.md` (TK). Plans: `roadmap/ROADMAP_BE.md` (steps B0.1…B5.4), `roadmap/ROADMAP_FE.md`. Run guides in `huong-dan/`. Requirement IDs: FR-01…FR-14 (TK §5), tests TC-01…TC-20 (TK §19).
Working git branch: `huynh_gia_pho_be` (not `main`).

## Response rules (save tokens)
- Reply in Vietnamese; code, identifiers, commit messages in English.
- Answer first, no preamble, no restating the question, no closing summary or offers.
- Only what the user needs: result, key reason, next step. Bullets/tables over paragraphs.
- Do not paste code you already wrote to files; list files instead.
- Ask a question only when blocked; otherwise pick the sensible default and state it in one line.

## Reading rules (save tokens)
- Never read a whole `docs/*.md` (they are 50–350 KB). Grep by ID or heading, then read the matching range.
- Prefer `graphify query "<question>"` when `graphify-out/graph.json` exists.
- Skip build output: `backend/target`, `frontend/.next`, `node_modules`.

## Skills
- `/be-code <step|ID>` — write backend code into files, verify, list files, stop.
- `/be-chat <topic|ID>` — explain in depth and show code in chat (no file writes).
- `/ui-brief` — load UI requirements (`frontend/design/YEU_CAU_GIAO_DIEN.md` + `mockups/shared/tokens.css`) before any UI work.
- `/ui-mockup <step|UI id|phase>` — HTML/CSS/JS mockup in `mockups/<phase>/`, wired to the real API.
- `/fe-from-mockup <mockup path>` — Next.js page/components identical to the mockup.
- `frontend-design` — Anthropic's design craft skill (brief in `design/` always wins).
- `/postman-sync <step|ID|all>` — add/update endpoints in Postman collection "VocabLearning API" (IDs in `postman/postman.json`).
- `/fe-report <PHASE>` — after a BE phase: verified API handoff report for FE in `report/<PHASE>_BAO_CAO_FE.md`.
- `/graphify` — build/query the knowledge graph of this repo (`graphify-out/`).

## Backend conventions
See `.Codex/skills/be-code/references/conventions.md` (load only for backend work).

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
