package com.do_an_tot_nghiep.k28.ai.client;

import com.do_an_tot_nghiep.k28.ai.config.ImageProperties;
import com.do_an_tot_nghiep.k28.common.job.JobException;
import com.do_an_tot_nghiep.k28.common.job.JobException.Kieu;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.ConnectException;
import java.net.SocketTimeoutException;
import java.net.UnknownHostException;
import java.net.http.HttpConnectTimeoutException;
import java.net.http.HttpTimeoutException;
import java.nio.channels.UnresolvedAddressException;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import javax.imageio.ImageIO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@Slf4j
@Component
@ConditionalOnProperty(name = "app.ai.image.provider", havingValue = "imagen")
public class ImagenImageClient implements ImageClient {

    private static final JsonMapper JSON = JsonMapper.builder().build();

    private final RestClient rest;
    private final ImageProperties.Imagen props;

    public ImagenImageClient(@Qualifier("imagenRestClient") RestClient rest, ImageProperties props) {
        this.rest = rest;
        this.props = props.imagen();
    }

    @Override
    public String nhaCungCap() {
        return "google";
    }

    @Override
    public ImageResult taoAnh(String prompt) {
        String body;
        try {
            body = rest.post()
                    .uri("/models/{model}:predict", props.model())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "instances", List.of(Map.of("prompt", prompt)),
                            "parameters", Map.of(
                                    "sampleCount", 1,
                                    "aspectRatio", "1:1",
                                    "personGeneration", "dont_allow")))
                    .retrieve()
                    .body(String.class);
        } catch (RestClientResponseException e) {
            throw statusError(e.getStatusCode().value());
        } catch (ResourceAccessException e) {
            throw accessError(e);
        } catch (RestClientException e) {
            log.warn("Imagen call ended without a readable result: {}", e.getClass().getSimpleName());
            throw new JobException(Kieu.KHONG_XAC_DINH, "MAT_KET_NOI");
        }
        JsonNode root;
        try {
            root = JSON.readTree(body == null ? "" : body);
        } catch (JacksonException e) {
            throw new JobException(Kieu.LOI, "SAI_SCHEMA");
        }
        return new ImageResult(toPng(parse(root), props.kichThuoc()), props.model(), null);
    }

    static byte[] parse(JsonNode root) {
        if (root == null || !root.isObject()) {
            throw new JobException(Kieu.LOI, "SAI_SCHEMA");
        }
        JsonNode predictions = root.path("predictions");
        if (!predictions.isArray() || predictions.isEmpty()) {
            throw new JobException(Kieu.LOI, "NCC_TU_CHOI_ND");
        }
        JsonNode first = predictions.get(0);
        if (first.path("raiFilteredReason").isString()) {
            throw new JobException(Kieu.LOI, "NCC_TU_CHOI_ND");
        }
        JsonNode data = first.path("bytesBase64Encoded");
        if (!data.isString() || data.asString().isBlank()) {
            throw new JobException(Kieu.LOI, "SAI_SCHEMA");
        }
        try {
            return Base64.getDecoder().decode(data.asString());
        } catch (IllegalArgumentException e) {
            throw new JobException(Kieu.LOI, "SAI_SCHEMA");
        }
    }

    static byte[] toPng(byte[] raw, int size) {
        BufferedImage source;
        try {
            source = ImageIO.read(new ByteArrayInputStream(raw));
        } catch (IOException e) {
            source = null;
        }
        if (source == null) {
            throw new JobException(Kieu.LOI, "ANH_KHONG_HOP_LE");
        }
        BufferedImage target = new BufferedImage(size, size, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = target.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
            g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            g.drawImage(source, 0, 0, size, size, null);
        } finally {
            g.dispose();
        }
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            ImageIO.write(target, "png", out);
        } catch (IOException e) {
            throw new JobException(Kieu.LOI, "ANH_KHONG_HOP_LE");
        }
        return out.toByteArray();
    }

    private JobException statusError(int status) {
        log.warn("Imagen returned HTTP {}", status);
        if (status == 429 || status == 408) {
            return new JobException(Kieu.THU_LAI, "NCC_GIOI_HAN");
        }
        if (status >= 500) {
            return new JobException(Kieu.THU_LAI, "NCC_LOI_5XX");
        }
        if (status == 401 || status == 403) {
            return new JobException(Kieu.LOI, "NCC_XAC_THUC");
        }
        return new JobException(Kieu.LOI, "NCC_TU_CHOI");
    }

    private JobException accessError(ResourceAccessException e) {
        for (Throwable cause = e; cause != null; cause = cause.getCause()) {
            if (cause instanceof HttpConnectTimeoutException || cause instanceof ConnectException
                    || cause instanceof UnknownHostException || cause instanceof UnresolvedAddressException) {
                return new JobException(Kieu.THU_LAI, "KET_NOI");
            }
            if (cause instanceof HttpTimeoutException || cause instanceof SocketTimeoutException) {
                return new JobException(Kieu.KHONG_XAC_DINH, "TIMEOUT");
            }
        }
        log.warn("Imagen connection broke: {}", e.getClass().getSimpleName());
        return new JobException(Kieu.KHONG_XAC_DINH, "MAT_KET_NOI");
    }
}
