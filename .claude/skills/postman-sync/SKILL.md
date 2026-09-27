---
name: postman-sync
description: Add or update VocabLearning backend endpoints in the Postman collection "VocabLearning API" (workspace VocabLearning) through the Postman MCP tools. Use after new or changed controllers/endpoints (e.g. right after /be-code finishes a step), or when the user says "thêm vào postman", "sync postman", "cập nhật postman", "tạo request postman". Puts each request in the right module folder with body, headers, description and test script.
argument-hint: "[roadmap step | requirement ID | 'all' to diff every endpoint]"
---

# postman-sync — keep the Postman collection in sync with the backend

Registry: `postman/postman.json` holds the workspace, collection, environment and folder IDs, the folder routing rules (`match` = path prefixes after `/api/v1`) and the list of already synced endpoints (`synced`).
**Always read it first.** Never search Postman for IDs that are already in the registry.

## Step 1 — Find endpoints to sync

- **Scope = a step or ID:** read only the controllers written or changed for it.
- **Scope = `all`:**
  1. `grep -rn "@\(Get\|Post\|Put\|Patch\|Delete\)Mapping\|@RequestMapping" backend/src/main/java`
  2. Build `METHOD /api/v1/path` for each endpoint.
  3. Keep only those not in `synced`.
- For each endpoint, read:
  - the controller method: path variables, `@RequestParam`, `@RequestHeader` (Idempotency-Key, If-Match), and the status it returns;
  - the request DTO record: fields and Bean Validation limits;
  - the response DTO;
  - `SecurityConfig`, for the permission G/L/O/A.
- An endpoint already in `synced` whose contract changed → update it (Step 3b), do not duplicate it.

## Step 2 — Build each request

| Part | Rule |
|---|---|
| Folder | Match the path prefix against `folders.*.match` in the registry; if nothing matches, ask the user in one line (or use `system`) |
| Name | Vietnamese action + ID, e.g. `Đăng ký (B1.1 · FR-01)`, `Tạo bộ thẻ (B1.8 · FR-03)` |
| URL | `{{baseUrl}}{{apiPrefix}}/path`; path variables use environment vars: `{{deckId}}`, `{{cardId}}`, `{{topicId}}` (add new env vars in Step 3c) |
| Headers | `Content-Type: application/json` when there is a body. `Idempotency-Key: {{$guid}}` when the controller reads it. `expectedVersion` in the body when it needs a version. **Never add `X-XSRF-TOKEN`**: the collection pre-request script adds it |
| Body | Raw JSON example that **passes** validation (realistic Vietnamese/English vocab data); use env vars like `{{userEmail}}`, `{{userPassword}}` for credentials |
| Query params | Every `@RequestParam`, with its default value; optional ones `enabled: false` |
| Description | Markdown: `METHOD /path` — permission; purpose (1 line); field table (field, type, required, limits); success status; error codes list; FE step/UI (`ROADMAP_FE`); requirement ID |
| Test script | Assert the success status. Assert key fields (IDs are strings). Save created IDs/ETags to the environment, e.g. `pm.environment.set('deckId', pm.response.json().id)` and `pm.environment.set('deckEtag', pm.response.headers.get('ETag'))` |
| Order | Inside a folder follow the user flow (e.g. register → verify → login → me → logout) |

Special flows:
- **Login:** the test saves nothing (the session cookie is kept by Postman). Add `Đăng xuất` last in the folder.
- **Verify email:** add a request `Mailpit — lấy mã xác thực` (`GET {{mailpitUrl}}/api/v1/messages`) in the same folder. Its test extracts the token from the newest message and sets `verifyToken`.
- **Negative cases:** for each important rule, add 1 request named `… → <code>` (e.g. `Đăng ký email trùng → 202 chung`, `Sửa sai phiên bản → 409`) whose test asserts the status + `code`. Put them in the module folder, after the happy path.

## Step 3 — Write to Postman (MCP)

a. **New request:** `createCollectionRequest` with:
   - `collectionId` = `collection.uid`
   - `folder` = the folder `id` (UUID); if the API rejects it, retry with `<ownerId>-<id>`
   - `name`, `method`, `url`, `headerData`, `dataMode: "raw"`, `rawModeData`, `dataOptions.raw.language = "json"`, `queryParams`, `description`
   - `events` = the test script (`listen: "test"`)

b. **Update an existing request:**
   1. `getCollection` (default map) to find the request id by name.
   2. Update that request, or, if there is no request-level update tool, `putCollection` the full collection **keeping all ids** (read with `model: "full"` first).
   3. Never drop other items.

c. **New environment variables** (e.g. `deckEtag`, `verifyToken`): add to **both** environments in `environments.*`.
   - Read the environment first and send the full list back, so no existing variable is lost.

d. After success:
   - append `METHOD /api/v1/path` to `synced` in `postman/postman.json`;
   - add new folders to the registry if you created any.

## Step 4 — Verify

- `getCollection` and check that each new request is in the expected folder.
- If the backend is running (`curl -s localhost:8080/actuator/health`), send the happy-path request once with `curl` using the same body. This proves the example body passes validation.
  - Do not create persistent junk beyond test accounts `*@test.local`.

## Step 5 — Report (only this)

```
**Postman:** thêm <n>, cập nhật <m> request vào "VocabLearning API"
| Thư mục | Request | Method + path |
|---|---|---|
**Biến môi trường mới:** <list or "không">
```

## Do not
- Do not put real secrets in requests or environments. Use `type: "secret"` for dev passwords.
- Do not duplicate requests. Check `synced` and the folder contents first.
- Do not change backend code in this skill.
