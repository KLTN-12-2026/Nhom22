package com.do_an_tot_nghiep.k28.account;

import static org.assertj.core.api.Assertions.assertThat;

import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import java.net.CookieManager;
import java.net.HttpCookie;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class FR01ForwardedIpTest extends AbstractIntegrationTest {

    @LocalServerPort
    int port;

    @Test
    void fr01_rateLimitUsesClientIpForwardedByTrustedProxy() throws Exception {
        CookieManager cookies = new CookieManager();
        HttpClient http = HttpClient.newBuilder().cookieHandler(cookies).build();
        http.send(HttpRequest.newBuilder(uri("/api/v1/auth/csrf")).GET().build(), HttpResponse.BodyHandlers.discarding());
        String token = cookies.getCookieStore().getCookies().stream()
                .filter(cookie -> cookie.getName().equals("XSRF-TOKEN"))
                .map(HttpCookie::getValue).findFirst().orElseThrow();
        String first = "203.0.113." + (1 + (int) (Math.random() * 100));
        String second = "198.51.100." + (1 + (int) (Math.random() * 100));

        for (int i = 0; i < 3; i++) {
            assertThat(forgot(http, token, first)).isEqualTo(200);
        }
        assertThat(forgot(http, token, first)).isEqualTo(429);
        assertThat(forgot(http, token, second)).isEqualTo(200);
    }

    private int forgot(HttpClient http, String token, String clientIp) throws Exception {
        String body = "{\"email\":\"f" + UUID.randomUUID() + "@vocab.local\"}";
        return http.send(HttpRequest.newBuilder(uri("/api/v1/auth/forgot-password"))
                .header("Content-Type", "application/json")
                .header("X-XSRF-TOKEN", token)
                .header("X-Forwarded-For", clientIp)
                .POST(HttpRequest.BodyPublishers.ofString(body)).build(), HttpResponse.BodyHandlers.discarding())
                .statusCode();
    }

    private URI uri(String path) {
        return URI.create("http://localhost:" + port + path);
    }
}
