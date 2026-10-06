package com.do_an_tot_nghiep.k28.content;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.entity.VaiTro;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.storage.StorageService;
import com.do_an_tot_nghiep.k28.common.storage.S3Properties;
import com.do_an_tot_nghiep.k28.content.service.FileCleanupWorker;
import com.do_an_tot_nghiep.k28.content.dto.UploadRequestResponse;
import com.do_an_tot_nghiep.k28.content.entity.enums.TrangThaiXoaTep;
import com.do_an_tot_nghiep.k28.content.repository.TepTinRepository;
import com.do_an_tot_nghiep.k28.content.service.FileService;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.net.URI;
import java.net.http.*;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.Executors;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@TestPropertySource(properties = "app.files.cleanup.enabled=false")
class FR03FilesTest extends AbstractIntegrationTest {

    @Autowired NguoiDungRepository users;
    @Autowired VaiTroRepository roles;
    @Autowired PasswordEncoder passwords;
    @Autowired TepTinRepository files;
    @Autowired FileService fileService;
    @Autowired JdbcTemplate jdbc;
    @Autowired S3Properties s3Properties;
    @Autowired software.amazon.awssdk.services.s3.S3Client s3;
    @MockitoSpyBean StorageService storage;
    private final HttpClient http = HttpClient.newHttpClient();
    private Cookie session;
    private Long userId;

    @BeforeEach
    void login() throws Exception {
        doAnswer(call -> {
            assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
            return call.callRealMethod();
        }).when(storage).readBounded(anyString(), anyInt());
        doAnswer(call -> {
            assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
            return call.callRealMethod();
        }).when(storage).putVerified(anyString(), any(byte[].class), anyString());
        String email = "file-" + UUID.randomUUID() + "@vocab.local";
        var user = NguoiDung.register(email, "Files", passwords.encode("matkhau123"),
                "Asia/Ho_Chi_Minh", roles.findByMa(VaiTro.USER).orElseThrow());
        user.verifyEmail(Instant.now());
        userId = users.save(user).getId();
        session = mockMvc.perform(post("/api/v1/auth/login").with(xsrf()).with(randomIp())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("email", email, "password", "matkhau123"))))
                .andExpect(status().isOk()).andReturn().getResponse().getCookie("SESSION");
        assertThat(session).isNotNull();
    }

    @Test
    void uploadDownloadAvatarAndDelete() throws Exception {
        byte[] content = FileFixtures.image("png");
        var request = request(content, "ANH", "image/png", sha(content));
        upload(request, content, "image/png");
        String response = complete(request.fileId(), 200);
        var result = jsonMapper.readTree(response);
        assertThat(download(result.get("downloadUrl").asText())).isEqualTo(content);
        assertThat(result.get("checksum").asText()).isEqualTo(sha(content));
        mockMvc.perform(put("/api/v1/me/avatar").cookie(session).with(xsrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("anhDaiDienId", request.fileId()))))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/me").cookie(session))
                .andExpect(jsonPath("$.anhDaiDienId").value(request.fileId()));
        mockMvc.perform(get("/api/v1/me/avatar").cookie(session)).andExpect(status().isOk());
        String key = files.findById(Long.valueOf(request.fileId())).orElseThrow().getObjectKey();
        mockMvc.perform(delete("/api/v1/files/" + request.fileId()).cookie(session).with(xsrf()))
                .andExpect(status().isNoContent());
        assertThat(storage.head(key)).isEmpty();
        assertThat(users.findById(userId).orElseThrow().getAnhDaiDienId()).isNull();
        mockMvc.perform(get("/api/v1/me/avatar").cookie(session)).andExpect(status().isNoContent());
        mockMvc.perform(delete("/api/v1/files/" + request.fileId()).cookie(session).with(xsrf()))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/v1/files/" + request.fileId()).cookie(session)).andExpect(status().isNotFound());
        complete(request.fileId(), 404);
    }

    @Test
    void pendingAndForeignFilesCannotBeUsed() throws Exception {
        var request = request(FileFixtures.image("png"), "ANH", "image/png", "0".repeat(64));
        complete(request.fileId(), 422);
        mockMvc.perform(put("/api/v1/me/avatar").cookie(session).with(xsrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("anhDaiDienId", request.fileId()))))
                .andExpect(status().isUnprocessableContent());
        Cookie owner = session;
        login();
        complete(request.fileId(), 404);
        mockMvc.perform(delete("/api/v1/files/" + request.fileId()).cookie(session).with(xsrf()))
                .andExpect(status().isNotFound());
        mockMvc.perform(put("/api/v1/me/avatar").cookie(session).with(xsrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("anhDaiDienId", request.fileId()))))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/files/" + request.fileId()).cookie(owner))
                .andExpect(status().isUnprocessableContent());
    }

    @Test
    void declaredAndActualSizeLimitsAreEnforced() throws Exception {
        mockMvc.perform(post("/api/v1/files/upload-requests").cookie(session).with(xsrf())
                        .contentType(MediaType.APPLICATION_JSON).content(toJson(Map.of(
                                "loai", "ANH", "mimeType", "image/png", "kichThuoc", 2097153,
                                "checksum", "0".repeat(64)))))
                .andExpect(status().isUnprocessableContent());
        var request = request(new byte[1], "ANH", "image/png", "0".repeat(64));
        upload(request, new byte[2097153], "image/png");
        complete(request.fileId(), 422);
    }

    @Test
    void mimeChecksumAndMalformedContentAreRejected() throws Exception {
        byte[] png = FileFixtures.image("png");
        var wrongMime = request(png, "ANH", "image/jpeg", sha(png));
        upload(wrongMime, png, "image/jpeg");
        complete(wrongMime.fileId(), 422);
        var wrongHash = request(png, "ANH", "image/png", "0".repeat(64));
        upload(wrongHash, png, "image/png");
        complete(wrongHash.fileId(), 422);
        byte[] fake = Arrays.copyOf(png, 16);
        var malformed = request(fake, "ANH", "image/png", sha(fake));
        upload(malformed, fake, "image/png");
        complete(malformed.fileId(), 422);
    }

    @Test
    void signedPutCannotOverwriteVerifiedContent() throws Exception {
        byte[] png = FileFixtures.image("png");
        var request = request(png, "ANH", "image/png", sha(png));
        upload(request, png, "image/png");
        String response = complete(request.fileId(), 200);
        upload(request, new byte[]{1, 2, 3}, "image/png");
        String repeated = complete(request.fileId(), 200);
        assertThat(download(jsonMapper.readTree(response).get("downloadUrl").asText())).isEqualTo(png);
        assertThat(jsonMapper.readTree(repeated).get("checksum").asText()).isEqualTo(sha(png));
    }

    @Test
    void concurrentCompletionKeepsOneCanonicalObject() throws Exception {
        byte[] png = FileFixtures.image("png");
        var request = request(png, "ANH", "image/png", sha(png));
        upload(request, png, "image/png");
        try (var executor = Executors.newFixedThreadPool(2)) {
            var first = executor.submit(() -> fileService.complete(userId, Long.valueOf(request.fileId())));
            var second = executor.submit(() -> fileService.complete(userId, Long.valueOf(request.fileId())));
            assertThat(first.get().checksum()).isEqualTo(second.get().checksum());
            assertThat(download(first.get().downloadUrl())).isEqualTo(png);
            assertThat(download(second.get().downloadUrl())).isEqualTo(png);
        }
    }

    @Test
    void wavIsAcceptedButCannotBecomeAvatar() throws Exception {
        byte[] wav = FileFixtures.wav(1);
        var request = request(wav, "AM_THANH", "audio/wav", sha(wav));
        upload(request, wav, "audio/wav");
        complete(request.fileId(), 200);
        mockMvc.perform(put("/api/v1/me/avatar").cookie(session).with(xsrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("anhDaiDienId", request.fileId()))))
                .andExpect(status().isUnprocessableContent());
    }

    @Test
    void failedStorageDeletionPersistsTombstoneAndCanBeRetried() throws Exception {
        byte[] png = FileFixtures.image("png");
        var request = request(png, "ANH", "image/png", sha(png));
        upload(request, png, "image/png");
        complete(request.fileId(), 200);
        String key = files.findById(Long.valueOf(request.fileId())).orElseThrow().getObjectKey();
        doThrow(new ApiException(ErrorCode.DEPENDENCY_DOWN, "Storage unavailable")).when(storage).delete(key);
        mockMvc.perform(delete("/api/v1/files/" + request.fileId()).cookie(session).with(xsrf()))
                .andExpect(status().isServiceUnavailable());
        var deleted = files.findById(Long.valueOf(request.fileId())).orElseThrow();
        assertThat(deleted.getTrangThaiXoa()).isEqualTo(TrangThaiXoaTep.DA_XOA);
        assertThat(deleted.getDaXoaObjectAt()).isNull();
        doAnswer(call -> {
            assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
            return call.callRealMethod();
        }).when(storage).delete(key);
        mockMvc.perform(delete("/api/v1/files/" + request.fileId()).cookie(session).with(xsrf()))
                .andExpect(status().isNoContent());
        assertThat(files.findById(Long.valueOf(request.fileId())).orElseThrow().getDaXoaObjectAt()).isNotNull();
    }

    @Test
    void unauthenticatedCsrfAndRateLimitsAreEnforced() throws Exception {
        mockMvc.perform(get("/api/v1/me/avatar")).andExpect(status().isUnauthorized());
        mockMvc.perform(delete("/api/v1/files/1").cookie(session)).andExpect(status().isForbidden());
        for (int i = 0; i < 30; i++) {
            request(new byte[1], "ANH", "image/png", "0".repeat(64));
        }
        mockMvc.perform(post("/api/v1/files/upload-requests").cookie(session).with(xsrf())
                        .contentType(MediaType.APPLICATION_JSON).content(toJson(Map.of(
                                "loai", "ANH", "mimeType", "image/png", "kichThuoc", 1,
                                "checksum", "0".repeat(64)))))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    void expiredPendingRequestIsRejectedAndWorkerRemovesObject() throws Exception {
        byte[] png = FileFixtures.image("png");
        var request = request(png, "ANH", "image/png", sha(png));
        upload(request, png, "image/png");
        Long id = Long.valueOf(request.fileId());
        String key = files.findById(id).orElseThrow().getObjectKey();
        jdbc.update("update tep_tin set created_at = ? where id = ?",
                java.sql.Timestamp.from(Instant.now().minus(java.time.Duration.ofDays(2))), id);
        complete(request.fileId(), 422);
        new FileCleanupWorker(files, storage, s3Properties, java.time.Clock.systemUTC()).cleanup();
        var expired = files.findById(id).orElseThrow();
        assertThat(expired.getTrangThaiXoa()).isEqualTo(TrangThaiXoaTep.DA_XOA);
        assertThat(expired.getDaXoaObjectAt()).isNotNull();
        assertThat(storage.head(key)).isEmpty();
    }

    @Test
    void removingAvatarKeepsUploadedFileAvailable() throws Exception {
        byte[] png = FileFixtures.image("png");
        var request = request(png, "ANH", "image/png", sha(png));
        upload(request, png, "image/png");
        complete(request.fileId(), 200);
        fileService.setAvatar(userId, Long.valueOf(request.fileId()));
        mockMvc.perform(delete("/api/v1/me/avatar").cookie(session).with(xsrf()))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/v1/me/avatar").cookie(session)).andExpect(status().isNoContent());
        mockMvc.perform(get("/api/v1/files/" + request.fileId()).cookie(session)).andExpect(status().isOk());
    }

    @Test
    void browserPreflightAllowsSignedUploadFromFrontend() throws Exception {
        s3.putBucketCors(r -> r.bucket(S3_BUCKET).corsConfiguration(c -> c.corsRules(rule -> rule
                .allowedOrigins("http://localhost:3000", "http://127.0.0.1:3000")
                .allowedMethods("GET", "PUT", "HEAD").allowedHeaders("*").exposeHeaders("ETag").maxAgeSeconds(600))));
        byte[] png = FileFixtures.image("png");
        var request = request(png, "ANH", "image/png", sha(png));
        var preflight = http.send(HttpRequest.newBuilder(URI.create(request.uploadUrl()))
                        .header("Origin", "http://localhost:3000")
                        .header("Access-Control-Request-Method", "PUT")
                        .header("Access-Control-Request-Headers", "content-type")
                        .method("OPTIONS", HttpRequest.BodyPublishers.noBody()).build(),
                HttpResponse.BodyHandlers.discarding());
        assertThat(preflight.statusCode()).isIn(200, 204);
        assertThat(preflight.headers().firstValue("access-control-allow-origin"))
                .contains("http://localhost:3000");
        upload(request, png, "image/png");
        complete(request.fileId(), 200);
    }

    @Test
    void fr03_linkedFileDeleteDoesNotChangeAvatarOrStorage() throws Exception {
        byte[] png = FileFixtures.image("png");
        var intent = request(png, "ANH", "image/png", sha(png));
        upload(intent, png, "image/png");
        complete(intent.fileId(), 200);
        Long fileId = Long.valueOf(intent.fileId());
        fileService.setAvatar(userId, fileId);
        jdbc.update("insert into bo_the(chu_so_huu_id,ten,trinh_do) values (?,?,?)", userId, "Linked file", "CO_BAN");
        Long deckId = jdbc.queryForObject("select max(id) from bo_the where chu_so_huu_id=?", Long.class, userId);
        jdbc.update("insert into the_tu_vung(bo_the_id,tu,nghia_vi) values (?,?,?)", deckId, "word", "tu");
        Long cardId = jdbc.queryForObject("select max(id) from the_tu_vung where bo_the_id=?", Long.class, deckId);
        jdbc.update("insert into the_tep(the_id,tep_id,vai_tro) values (?,?,?)", cardId, fileId, "ANH");
        clearInvocations(storage);
        mockMvc.perform(delete("/api/v1/files/" + fileId).cookie(session).with(xsrf()))
                .andExpect(status().isConflict());
        assertThat(fileService.avatar(userId).id()).isEqualTo(intent.fileId());
        assertThat(files.findById(fileId).orElseThrow().getXoaAt()).isNull();
        assertThat(files.findById(fileId).orElseThrow().getDaXoaObjectAt()).isNull();
        verify(storage, never()).delete(anyString());
    }

    private UploadRequestResponse request(byte[] bytes, String type, String mime, String checksum) throws Exception {
        String body = mockMvc.perform(post("/api/v1/files/upload-requests").cookie(session).with(xsrf())
                        .contentType(MediaType.APPLICATION_JSON).content(toJson(Map.of(
                                "loai", type, "mimeType", mime, "kichThuoc", bytes.length,
                                "checksum", checksum, "objectKey", "client-must-not-control-this"))))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        var result = jsonMapper.readValue(body, UploadRequestResponse.class);
        assertThat(result.uploadUrl()).contains("pending/");
        assertThat(result.uploadUrl()).doesNotContain("client-must-not-control-this");
        return result;
    }

    private void upload(UploadRequestResponse request, byte[] bytes, String mime) throws Exception {
        var response = http.send(HttpRequest.newBuilder(URI.create(request.uploadUrl()))
                .header("Content-Type", mime).PUT(HttpRequest.BodyPublishers.ofByteArray(bytes)).build(),
                HttpResponse.BodyHandlers.discarding());
        assertThat(response.statusCode()).isEqualTo(200);
    }

    private String complete(String id, int expected) throws Exception {
        return mockMvc.perform(post("/api/v1/files/" + id + "/complete").cookie(session).with(xsrf()))
                .andExpect(status().is(expected)).andReturn().getResponse().getContentAsString();
    }

    private byte[] download(String url) throws Exception {
        var response = http.send(HttpRequest.newBuilder(URI.create(url)).GET().build(), HttpResponse.BodyHandlers.ofByteArray());
        assertThat(response.statusCode()).isEqualTo(200);
        return response.body();
    }

    private String sha(byte[] bytes) throws Exception {
        return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
    }
}
