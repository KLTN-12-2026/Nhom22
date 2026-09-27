# VocabLearning backend conventions (shared by `be-code` and `be-chat`)

Sources of truth:
- Requirements/design: `docs/PHAN_TICH_THIET_KE_HE_THONG_HOC_TU_VUNG_K28.md` (= **TK**). Never read it whole — grep then read the range:
  - FR list §5 `grep -n "FR-0x" docs/PHAN_TICH*.md` · flows §6 · SRS rules §7 · practice/recommendation §8 · modules §11.2 · session §11.3
  - tables §12.2 `grep -n "\`<table>\`" docs/PHAN_TICH*.md` · constraints §12.4 · API §13 · AI/speech §14 · rewards §15 · security §16 · tests TC §19
- Plan: `roadmap/ROADMAP_BE.md` — steps `B<phase>.<n>` with FR/TC IDs, tables, endpoints, done-criteria.
- If `graphify-out/graph.json` exists, ask `graphify query "<question>"` before grepping code.

Principle: **simple and correct**. No microservices, outbox, ETags, cursor paging, hexagonal layers or extra abstractions unless a step asks for it.

## Stack
Java 21, Spring Boot 4.x, Spring MVC, Validation, Spring Security + Spring Session (Redis), OAuth2 Client, Spring Data JPA (Hibernate 7),
Flyway, MySQL 8.4, Redis, S3 (RustFS in dev) via AWS SDK v2, Mail (Mailpit in dev), springdoc-openapi, **Lombok**, **MapStruct**,
JUnit 5 + Mockito + MockMvc + Testcontainers, Docker Compose.
Boot 4 ships Jackson 3 (`tools.jackson.*`); annotations stay `com.fasterxml.jackson.annotation.*`. Use `jakarta.*`, never `javax.*`.

## Layout
`backend/k28/src/main/java/com/do_an_tot_nghiep/k28/<module>/{controller,service,repository,entity,dto,mapper}`
Modules (TK §11.2): account, content, learning, practice, ai, speaking, stats, engagement, notification, admin.
`common/`: config, security, exception, web, entity, storage, mail, job.
Rule: a module calls another module only through its **service**, never another module's repository.
Migrations: `src/main/resources/db/migration/V<n>__<module>.sql`; dev seed in `db/seed/` (dev profile only).

## Naming
- DB tables/columns: Vietnamese without accents exactly as TK §12.2 (`bo_the`, `chu_so_huu_id`); technical names stay English (`id`, `email`, `password_hash`, `created_at`, `updated_at`, `version`).
- Entity class/field = DB name in camelCase (`BoThe` ↔ `bo_the`, `chuSoHuuId`). Default snake_case naming maps them: no `@Table`/`@Column(name=…)`. `ddl-auto=validate` catches typos.
- Repository `<Entity>Repository`; enums stored as `VARCHAR` with `@Enumerated(EnumType.STRING)`, values = SQL CHECK list (e.g. `TrangThaiTienDo { MOI, DANG_HOC, ON_TAP, HOC_LAI, TAM_NGUNG }`).
- Services/controllers/DTOs/packages in English (`DeckService`, `CreateDeckRequest`).
- API: `/api/v1/...` English paths (TK §13.2), JSON camelCase, IDs serialized as strings.

## Code shape
- **No comments** in code or config files (Java, SQL, YAML, XML, Dockerfile, compose). Explanations go to docs/README.
- **Entity**: Lombok `@Getter` + `@NoArgsConstructor(access = PROTECTED)`; extends `BaseEntity` (createdAt/updatedAt). No `@Data`/`@Setter` — change state through named methods (`deck.rename(...)`). `@Version Long version` where the table has `version`.
- **DTO**: Java `record` + Bean Validation (`@NotBlank @Size(max = 150)`). Request `XxxRequest`, response `XxxResponse`.
- **Mapper**: MapStruct `@Mapper interface XxxMapper` in `<module>/mapper` (componentModel=spring set in pom). Use `@Mapping(target = "x", ignore = true)` / `source` for name differences; update entities via `@MappingTarget` only for plain fields. No hand-written mapping loops.
- **Lombok**: `@RequiredArgsConstructor` for injection, `@Slf4j` for logs, `@Builder` for objects with > 4 fields.
- **Controller**: thin — `@Valid` DTO → service → response. No repositories, no business rules.
- **Service**: `@Transactional`; load + ownership check first → other users' private data = 404. SRS, grading, rewards live here (TK §11.2).
- **Repository**: Spring Data interface; `@Query` / `Specification` for filters; native SQL only for queues/aggregates (`FOR UPDATE SKIP LOCKED`).
- **Time**: inject `Clock`; store UTC `Instant` in `DATETIME(3)`; local day with the user's IANA zone (TK §7.3).
- **No network calls inside a DB transaction**: mail via `@TransactionalEventListener(AFTER_COMMIT)` + `@Async`; AI/speech/deletion via `JobService` (`tac_vu_nen`).
- Reuse `common/`: `ApiException`, `ErrorCode`, `CurrentUser`, `RateLimiter`, `PageResponse`, `StorageService`, `MailService`, `JobService`, `QuotaService`.

## Errors (TK §13.1)
Throw `new ApiException(ErrorCode.X, "Vietnamese message")`; `GlobalExceptionHandler` returns `{code, message, fieldErrors, requestId}`.
400 validation · 401 unauthenticated · 403 forbidden · 404 not found (also foreign private data) · 409 conflict/duplicate/stale version · 422 business rule · 429 quota/rate limit · 503 dependency down. Never return stack traces.

## Write safety (only where TK requires it)
- Reviews: unique `(nguoi_dung_id, client_event_id)` + `expectedVersion` (TK §7.4) — replay returns the stored result.
- Practice submit `submitKey`, deck copy / CSV commit / AI commit `Idempotency-Key`, reward ledger unique `(nguoi_dung_id, loai_su_kien, su_kien_id)`.
- Duplicate race: rely on the unique key and catch `DataIntegrityViolationException`.

## Security
Redis session cookie (HttpOnly, SameSite=Lax), CSRF cookie + header `X-XSRF-TOKEN`, BCrypt, `/api/v1/admin/**` = ADMIN.
Never trust `userId`, dates, scores or XP from the client. Never log passwords, tokens, API keys, signed URLs.

## Tests
- Pure logic (SRS, grading, normalization, streak): plain JUnit with fixed `Clock`.
- API/DB: extend `AbstractIntegrationTest` (`@SpringBootTest` + MockMvc + Testcontainers MySQL/Redis).
- Name after IDs: `FR06ReviewTest` with methods `tc05_twoDirectionsIndependent`, `tc08_duplicateEvent`.

## Commands (from `backend/k28/`)
- Compile: `./mvnw -q -DskipTests compile` · one test: `./mvnw -q test -Dtest=ClassName` · all: `./mvnw -q verify`
- Dev services: `docker compose up -d` (MySQL 3307, Redis 6379, RustFS (S3) 9000/9001, Mailpit 1025/8025)
- Full stack: `docker compose --profile app up -d --build`
- PowerShell: `.\mvnw.cmd`. After a big step: `graphify update .` (from repo root) to refresh the code graph.
