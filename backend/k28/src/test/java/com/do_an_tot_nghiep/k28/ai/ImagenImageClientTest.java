package com.do_an_tot_nghiep.k28.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.do_an_tot_nghiep.k28.ai.client.ImageClient;
import com.do_an_tot_nghiep.k28.ai.client.ImageResult;
import com.do_an_tot_nghiep.k28.ai.client.ImagenImageClient;
import com.do_an_tot_nghiep.k28.ai.config.AiConfig;
import com.do_an_tot_nghiep.k28.ai.config.ImageProperties;
import com.do_an_tot_nghiep.k28.common.job.JobException;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.time.Duration;
import java.util.Base64;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class ImagenImageClientTest {

    private static final String URL = "https://imagen.test/v1beta/models/imagen-test:predict";

    private MockRestServiceServer server;
    private ImagenImageClient client;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder()
                .baseUrl("https://imagen.test/v1beta")
                .defaultHeader("x-goog-api-key", "test-key");
        server = MockRestServiceServer.bindTo(builder).build();
        ImageProperties props = new ImageProperties("imagen", 2_097_152, new ImageProperties.Imagen(
                "https://imagen.test/v1beta", "test-key", "imagen-test", 512, Duration.ofSeconds(5), Duration.ofSeconds(60)));
        client = new ImagenImageClient(builder.build(), props);
    }

    @Test
    void tc12_successReturnsResizedPng() throws Exception {
        String b64 = Base64.getEncoder().encodeToString(png(1024));
        server.expect(requestTo(URL))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("x-goog-api-key", "test-key"))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("\"prompt\":\"a cat\"")))
                .andRespond(withSuccess("{\"predictions\":[{\"bytesBase64Encoded\":\"" + b64 + "\",\"mimeType\":\"image/png\"}]}",
                        MediaType.APPLICATION_JSON));

        ImageResult result = client.taoAnh("a cat");

        BufferedImage image = ImageIO.read(new ByteArrayInputStream(result.png()));
        assertThat(image.getWidth()).isEqualTo(512);
        assertThat(image.getHeight()).isEqualTo(512);
        assertThat(result.png()).startsWith(0x89, 'P', 'N', 'G');
        assertThat(result.model()).isEqualTo("imagen-test");
        assertThat(client.nhaCungCap()).isEqualTo("google");
        server.verify();
    }

    @Test
    void tc12_filteredOrEmptyResultIsRejectedContent() {
        server.expect(requestTo(URL)).andRespond(withSuccess("{\"predictions\":[{\"raiFilteredReason\":\"blocked\"}]}",
                MediaType.APPLICATION_JSON));
        assertThatThrownBy(() -> client.taoAnh("x")).isInstanceOf(JobException.class).hasMessage("NCC_TU_CHOI_ND");

        server.reset();
        server.expect(requestTo(URL)).andRespond(withSuccess("{}", MediaType.APPLICATION_JSON));
        assertThatThrownBy(() -> client.taoAnh("x")).isInstanceOf(JobException.class).hasMessage("NCC_TU_CHOI_ND");
    }

    @Test
    void tc12_brokenPayloadIsSchemaOrImageError() {
        server.expect(requestTo(URL)).andRespond(withSuccess("not json", MediaType.TEXT_PLAIN));
        assertThatThrownBy(() -> client.taoAnh("x")).isInstanceOf(JobException.class).hasMessage("SAI_SCHEMA");

        server.reset();
        server.expect(requestTo(URL)).andRespond(withSuccess("{\"predictions\":[{\"bytesBase64Encoded\":\"%%%\"}]}",
                MediaType.APPLICATION_JSON));
        assertThatThrownBy(() -> client.taoAnh("x")).isInstanceOf(JobException.class).hasMessage("SAI_SCHEMA");

        server.reset();
        String notImage = Base64.getEncoder().encodeToString("hello".getBytes());
        server.expect(requestTo(URL)).andRespond(withSuccess("{\"predictions\":[{\"bytesBase64Encoded\":\"" + notImage + "\"}]}",
                MediaType.APPLICATION_JSON));
        assertThatThrownBy(() -> client.taoAnh("x")).isInstanceOf(JobException.class).hasMessage("ANH_KHONG_HOP_LE");
    }

    @Test
    void tc12_httpErrorsMapToRetryOrFailure() {
        server.expect(requestTo(URL)).andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS));
        assertThatThrownBy(() -> client.taoAnh("x")).isInstanceOfSatisfying(JobException.class, e -> {
            assertThat(e.getKieu()).isEqualTo(JobException.Kieu.THU_LAI);
            assertThat(e.getMaLoi()).isEqualTo("NCC_GIOI_HAN");
        });

        server.reset();
        server.expect(requestTo(URL)).andRespond(withStatus(HttpStatus.FORBIDDEN));
        assertThatThrownBy(() -> client.taoAnh("x")).isInstanceOfSatisfying(JobException.class, e -> {
            assertThat(e.getKieu()).isEqualTo(JobException.Kieu.LOI);
            assertThat(e.getMaLoi()).isEqualTo("NCC_XAC_THUC");
        });

        server.reset();
        server.expect(requestTo(URL)).andRespond(withStatus(HttpStatus.SERVICE_UNAVAILABLE));
        assertThatThrownBy(() -> client.taoAnh("x")).isInstanceOfSatisfying(JobException.class,
                e -> assertThat(e.getKieu()).isEqualTo(JobException.Kieu.THU_LAI));
    }

    @Test
    void imagenProviderWiresClientAndRequiresKey() {
        ApplicationContextRunner runner = new ApplicationContextRunner()
                .withUserConfiguration(AiConfig.class, ImagenImageClient.class)
                .withPropertyValues(
                        "app.ai.provider=fake",
                        "app.ai.image.provider=imagen",
                        "app.ai.image.max-bytes=2097152",
                        "app.ai.image.imagen.base-url=https://imagen.test/v1beta",
                        "app.ai.image.imagen.model=imagen-test",
                        "app.ai.image.imagen.kich-thuoc=512",
                        "app.ai.image.imagen.connect-timeout=5s",
                        "app.ai.image.imagen.read-timeout=60s");
        runner.withPropertyValues("app.ai.image.imagen.api-key=test-key").run(ctx ->
                assertThat(ctx).getBean(ImageClient.class).isInstanceOf(ImagenImageClient.class));
        runner.run(ctx -> assertThat(ctx).hasFailed());
    }

    private static byte[] png(int size) throws Exception {
        BufferedImage image = new BufferedImage(size, size, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();
        g.setColor(Color.ORANGE);
        g.fillRect(0, 0, size, size);
        g.dispose();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, "png", out);
        return out.toByteArray();
    }
}
