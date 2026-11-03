package com.do_an_tot_nghiep.k28.common.storage;

import static org.assertj.core.api.Assertions.assertThat;

import com.do_an_tot_nghiep.k28.common.storage.StorageService.ObjectInfo;
import com.do_an_tot_nghiep.k28.common.storage.StorageService.PresignedUrl;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class StorageServiceTest extends AbstractIntegrationTest {

    private final HttpClient http = HttpClient.newHttpClient();

    @Autowired
    StorageService storage;

    @Test
    void uploadAndDownloadThroughSignedUrls() throws Exception {
        String key = storage.newObjectKey("test");
        byte[] content = "xin chào".getBytes(StandardCharsets.UTF_8);

        PresignedUrl put = storage.presignPut(key, "text/plain");
        assertThat(put.url()).contains("X-Amz-Signature");
        assertThat(put.expiresAt()).isAfter(Instant.now());
        HttpResponse<String> uploaded = http.send(HttpRequest.newBuilder(URI.create(put.url()))
                .header("Content-Type", "text/plain")
                .PUT(HttpRequest.BodyPublishers.ofByteArray(content))
                .build(), HttpResponse.BodyHandlers.ofString());
        assertThat(uploaded.statusCode()).isEqualTo(200);

        assertThat(storage.head(key)).contains(new ObjectInfo(content.length, "text/plain"));

        PresignedUrl get = storage.presignGet(key);
        HttpResponse<byte[]> downloaded = http.send(HttpRequest.newBuilder(URI.create(get.url())).GET().build(),
                HttpResponse.BodyHandlers.ofByteArray());
        assertThat(downloaded.statusCode()).isEqualTo(200);
        assertThat(downloaded.body()).isEqualTo(content);

        storage.delete(key);
        assertThat(storage.head(key)).isEmpty();
    }

    @Test
    void bucketIsPrivate() throws Exception {
        String key = storage.newObjectKey("test");
        http.send(HttpRequest.newBuilder(URI.create(storage.presignPut(key, "text/plain").url()))
                .header("Content-Type", "text/plain")
                .PUT(HttpRequest.BodyPublishers.ofString("secret"))
                .build(), HttpResponse.BodyHandlers.discarding());

        HttpResponse<Void> anonymous = http.send(
                HttpRequest.newBuilder(URI.create(s3Endpoint() + "/" + S3_BUCKET + "/" + key)).GET().build(),
                HttpResponse.BodyHandlers.discarding());
        assertThat(anonymous.statusCode()).isEqualTo(403);
    }
}
