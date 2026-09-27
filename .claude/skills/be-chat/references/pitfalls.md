# Known pitfalls (Spring Boot 4.1 / Hibernate 7 / MySQL 8.4) — apply without test-building

| Situation | Do this |
|---|---|
| `@Enumerated(EnumType.STRING)` on a VARCHAR column | Add `@JdbcTypeCode(SqlTypes.VARCHAR)`; otherwise `ddl-auto=validate` expects a MySQL ENUM and fails |
| Entity with assigned `@Id` (1:1 tables keyed by `nguoi_dung_id`) | Use a `Long` (wrapper) `@Version` so a null version means "new" (no extra SELECT). Without a version column, accept the merge SELECT |
| Map only some columns of a table | Allowed: unmapped columns take DB defaults on INSERT; `validate` checks only mapped columns |
| `TEXT` column ↔ `String` | Add `columnDefinition = "TEXT"` |
| `Instant` ↔ `DATETIME(3)` | Works as is (`hibernate.jdbc.time_zone=UTC` is set) |
| Record DTO with a password | Override `toString()` to hide it |
| Trim before validation | Record compact constructor (runs before `@Valid`) |
| Duplicate insert race | Unique key + catch `DataIntegrityViolationException`, check the constraint name (`uk_...`) |
| JDBC + JPA in one method | Same transaction and connection; JPA `IDENTITY` inserts immediately, so FKs from JDBC work |
| Jackson | Boot 4 = Jackson 3 (`tools.jackson.*`), exceptions unchecked; annotations still `com.fasterxml.jackson.annotation.*` |
| Tests on `/auth/register`-like endpoints | Random `setRemoteAddr` per test (IP rate limit lives in Redis across tests); CSRF via `.cookie(new Cookie("XSRF-TOKEN", t)).header("X-XSRF-TOKEN", t)`. **Never** `.with(csrf())`: it swaps the CsrfTokenRepository of the shared test context and breaks `SecurityBaselineTest` |
| Netty/Redis `Unable to establish loopback connection` in tests (Claude's shell only) | Run Maven with `JAVA_TOOL_OPTIONS='-Djdk.net.unixdomain.tmpdir=C:\Users\Public'` (AF_UNIX fails under the short-name temp path) |
| MockMvc JSON filter | `jsonPath("$.fieldErrors[?(@.field == 'x')]").exists()` |
| Time in services | Inject `Clock`, never `Instant.now()` |
| Network in transaction | Never; mail after commit (`@TransactionalEventListener` + `@Async`), AI/speech via `JobService` |
| MapStruct can't see Lombok getters/builder ("Unknown property") | Processor order Lombok → `lombok-mapstruct-binding` → `mapstruct-processor` in `maven-compiler-plugin` |
| MapStruct mapper not injectable | `-Amapstruct.defaultComponentModel=spring` in pom (or `@Mapper(componentModel = "spring")`); rebuild so `target/generated-sources` refreshes |
| MapStruct + entity without setters | Map DTO → entity via a constructor/`@Builder`, or update through entity methods; `@MappingTarget` needs setters |
| Lombok `@Data`/`@EqualsAndHashCode` on entities | Don't: breaks lazy loading and Sets; use `@Getter` only |
| Lombok `@Builder` + `@NoArgsConstructor` | Add `@AllArgsConstructor(access = PRIVATE)` too, else compile error |
| `mvnw: /bin/sh^M` in Docker build | `.gitattributes` `mvnw text eol=lf`, re-checkout the file |
| API container can't reach MySQL | In profile `docker` use host `mysql:3306` (service name), not `localhost:3307`; wait with `depends_on: condition: service_healthy` |
| Flyway on Boot 4 does nothing | Needs `spring-boot-starter-flyway` (Boot 4 modules) + `flyway-mysql` |
- Session cookie: `server.servlet.session.cookie.*` is NOT applied by Spring Session (cookie came out as `SESSION` without HttpOnly). Name/flags live in the `CookieSerializer` bean in `SecurityConfig`.
- `jdbc.queryForObject(..., Instant.class)` fails on DATETIME (returns LocalDateTime); read `java.sql.Timestamp` in tests.
- Boot 4 renamed `spring.session.redis.*` → `spring.session.data.redis.*` (old names are silently ignored → no `FindByIndexNameSessionRepository` bean).
