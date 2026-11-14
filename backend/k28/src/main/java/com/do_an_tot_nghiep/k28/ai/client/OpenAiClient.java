package com.do_an_tot_nghiep.k28.ai.client;

import com.do_an_tot_nghiep.k28.ai.config.AiProperties;
import com.do_an_tot_nghiep.k28.common.job.JobException;
import com.do_an_tot_nghiep.k28.common.job.JobException.Kieu;
import java.net.ConnectException;
import java.net.SocketTimeoutException;
import java.net.UnknownHostException;
import java.net.http.HttpConnectTimeoutException;
import java.net.http.HttpTimeoutException;
import java.nio.channels.UnresolvedAddressException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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
@ConditionalOnProperty(name = "app.ai.provider", havingValue = "openai")
public class OpenAiClient implements AiClient {

    private final RestClient rest;
    private final AiProperties.OpenAi props;
    private final JsonMapper json;

    public OpenAiClient(@Qualifier("openAiRestClient") RestClient rest, AiProperties props, JsonMapper json) {
        this.rest = rest;
        this.props = props.openai();
        this.json = json;
    }

    @Override
    public String nhaCungCap() {
        return "openai";
    }

    @Override
    public AiResponse taoNoiDung(AiRequest request) {
        String raw;
        try {
            raw = rest.post()
                    .uri("/chat/completions")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(json.writeValueAsString(body(request)))
                    .retrieve()
                    .body(String.class);
        } catch (RestClientResponseException e) {
            throw statusError(e.getStatusCode().value());
        } catch (ResourceAccessException e) {
            throw accessError(e);
        } catch (RestClientException e) {
            log.warn("OpenAI call ended without a readable result: {}", e.getClass().getSimpleName());
            throw new JobException(Kieu.KHONG_XAC_DINH, "MAT_KET_NOI");
        }
        return parse(raw);
    }

    private Map<String, Object> body(AiRequest request) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", props.model());
        body.put("temperature", props.temperature());
        body.put("max_completion_tokens", props.maxOutputTokens());
        body.put("messages", List.of(
                Map.of("role", "system", "content", request.systemPrompt()),
                Map.of("role", "user", "content", request.userPrompt())));
        body.put("response_format", Map.of(
                "type", "json_schema",
                "json_schema", Map.of("name", request.schemaName(), "strict", true, "schema", request.schema())));
        return body;
    }

    private AiResponse parse(String raw) {
        JsonNode root;
        try {
            root = json.readTree(raw == null ? "" : raw);
        } catch (JacksonException e) {
            throw new JobException(Kieu.LOI, "SAI_SCHEMA");
        }
        JsonNode message = root.path("choices").path(0).path("message");
        if (message.path("refusal").isString()) {
            throw new JobException(Kieu.LOI, "NCC_TU_CHOI_ND");
        }
        if (!message.path("content").isString()) {
            throw new JobException(Kieu.LOI, "SAI_SCHEMA");
        }
        JsonNode usage = root.path("usage");
        return new AiResponse(
                message.path("content").asString(),
                root.path("model").isString() ? root.path("model").asString() : props.model(),
                root.path("id").isString() ? root.path("id").asString() : null,
                usage.path("prompt_tokens").isIntegralNumber() ? usage.path("prompt_tokens").asInt() : null,
                usage.path("completion_tokens").isIntegralNumber() ? usage.path("completion_tokens").asInt() : null);
    }

    private JobException statusError(int status) {
        log.warn("OpenAI returned HTTP {}", status);
        if (status == 429 || status == 408 || status == 409) {
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
        log.warn("OpenAI connection broke: {}", e.getClass().getSimpleName());
        return new JobException(Kieu.KHONG_XAC_DINH, "MAT_KET_NOI");
    }
}
