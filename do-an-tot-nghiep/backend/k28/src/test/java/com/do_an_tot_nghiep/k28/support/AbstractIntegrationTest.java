package com.do_an_tot_nghiep.k28.support;

import jakarta.servlet.http.Cookie;
import java.net.URI;
import java.util.Arrays;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Stream;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.mysql.MySQLContainer;
import org.testcontainers.utility.DockerImageName;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import tools.jackson.databind.json.JsonMapper;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class AbstractIntegrationTest {

    @ServiceConnection
    protected static final MySQLContainer MYSQL = new MySQLContainer(DockerImageName.parse("mysql:8.4"))
            .withDatabaseName("vocab_learn");

    @ServiceConnection(name = "redis")
    protected static final GenericContainer<?> REDIS = new GenericContainer<>(DockerImageName.parse("redis:7.4-alpine"))
            .withExposedPorts(6379);

    protected static final String S3_ACCESS_KEY = "s3test";
    protected static final String S3_SECRET_KEY = "s3test_secret";
    protected static final String S3_BUCKET = "vocab-files";

    protected static final GenericContainer<?> S3 = new GenericContainer<>(DockerImageName.parse("rustfs/rustfs:latest"))
            .withEnv("RUSTFS_ACCESS_KEY", S3_ACCESS_KEY)
            .withEnv("RUSTFS_SECRET_KEY", S3_SECRET_KEY)
            .withExposedPorts(9000)
            .waitingFor(Wait.forHttp("/health").forPort(9000));

    protected static final GenericContainer<?> MAILPIT = new GenericContainer<>(DockerImageName.parse("axllent/mailpit:latest"))
            .withExposedPorts(1025, 8025)
            .waitingFor(Wait.forHttp("/livez").forPort(8025));

    static {
        MYSQL.start();
        REDIS.start();
        S3.start();
        MAILPIT.start();
        createBucket();
    }

    @DynamicPropertySource
    static void externalServices(DynamicPropertyRegistry registry) {
        registry.add("app.s3.endpoint", AbstractIntegrationTest::s3Endpoint);
        registry.add("app.s3.public-endpoint", AbstractIntegrationTest::s3Endpoint);
        registry.add("app.s3.access-key", () -> S3_ACCESS_KEY);
        registry.add("app.s3.secret-key", () -> S3_SECRET_KEY);
        registry.add("app.s3.bucket", () -> S3_BUCKET);
        registry.add("spring.mail.host", MAILPIT::getHost);
        registry.add("spring.mail.port", () -> MAILPIT.getMappedPort(1025));
    }

    protected static String s3Endpoint() {
        return "http://" + S3.getHost() + ":" + S3.getMappedPort(9000);
    }

    protected static String mailpitApi() {
        return "http://" + MAILPIT.getHost() + ":" + MAILPIT.getMappedPort(8025) + "/api/v1";
    }

    private static void createBucket() {
        try (S3Client client = S3Client.builder()
                .endpointOverride(URI.create(s3Endpoint()))
                .region(Region.US_EAST_1)
                .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(S3_ACCESS_KEY, S3_SECRET_KEY)))
                .forcePathStyle(true)
                .build()) {
            client.createBucket(r -> r.bucket(S3_BUCKET));
        }
    }

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected JsonMapper jsonMapper;

    protected static RequestPostProcessor xsrf() {
        String token = UUID.randomUUID().toString();
        return request -> {
            Cookie[] existing = request.getCookies() == null ? new Cookie[0] : request.getCookies();
            Cookie[] cookies = Stream.concat(Arrays.stream(existing), Stream.of(new Cookie("XSRF-TOKEN", token)))
                    .toArray(Cookie[]::new);
            request.setCookies(cookies);
            request.addHeader("X-XSRF-TOKEN", token);
            return request;
        };
    }

    protected static RequestPostProcessor randomIp() {
        ThreadLocalRandom random = ThreadLocalRandom.current();
        String ip = "10." + random.nextInt(256) + "." + random.nextInt(256) + "." + random.nextInt(1, 255);
        return request -> {
            request.setRemoteAddr(ip);
            return request;
        };
    }

    protected String toJson(Object body) {
        return jsonMapper.writeValueAsString(body);
    }
}