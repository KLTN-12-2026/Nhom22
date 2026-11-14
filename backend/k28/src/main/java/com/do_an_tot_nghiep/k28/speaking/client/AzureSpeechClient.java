package com.do_an_tot_nghiep.k28.speaking.client;

import com.do_an_tot_nghiep.k28.speaking.config.SpeechProperties;
import com.do_an_tot_nghiep.k28.speaking.dto.ChiSoPhatAm;
import com.do_an_tot_nghiep.k28.speaking.dto.ChiSoTu;
import com.do_an_tot_nghiep.k28.speaking.entity.enums.LoiPhatAm;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
@ConditionalOnProperty(name = "app.speech.provider", havingValue = "azure")
public class AzureSpeechClient implements SpeechClient {

    private static final MediaType WAV = MediaType.parseMediaType("audio/wav; codecs=\"audio/pcm\"; samplerate=16000");
    private static final Set<String> NO_SPEECH = Set.of("NoMatch", "InitialSilenceTimeout", "BabbleTimeout");
    private static final int MAX_WORDS = 50;

    private final RestClient rest;
    private final SpeechProperties props;
    private final JsonMapper json;

    public AzureSpeechClient(@Qualifier("azureSpeechRestClient") RestClient rest, SpeechProperties props,
                             JsonMapper json) {
        this.rest = rest;
        this.props = props;
        this.json = json;
    }

    @Override
    public String nhaCungCap() {
        return "azure";
    }

    @Override
    public SpeechResult danhGia(byte[] wav, String vanBanMau) {
        String body;
        try {
            body = rest.post()
                    .uri(uri -> uri.path("/speech/recognition/conversation/cognitiveservices/v1")
                            .queryParam("language", props.ngonNgu())
                            .queryParam("format", "detailed")
                            .build())
                    .contentType(WAV)
                    .accept(MediaType.APPLICATION_JSON)
                    .header("Pronunciation-Assessment", assessmentHeader(vanBanMau))
                    .body(wav)
                    .retrieve()
                    .body(String.class);
        } catch (RestClientResponseException e) {
            log.warn("Azure Speech returned HTTP {}", e.getStatusCode().value());
            throw new SpeechException(e.getStatusCode().is5xxServerError() ? "NCC_LOI_5XX"
                    : e.getStatusCode().value() == 429 ? "NCC_GIOI_HAN" : "NCC_TU_CHOI");
        } catch (ResourceAccessException e) {
            log.warn("Azure Speech connection failed: {}", e.getClass().getSimpleName());
            throw new SpeechException("TIMEOUT");
        } catch (RestClientException e) {
            log.warn("Azure Speech call ended without a readable result: {}", e.getClass().getSimpleName());
            throw new SpeechException("MAT_KET_NOI");
        }
        try {
            return new SpeechResult(parse(json.readTree(body == null ? "" : body)), false);
        } catch (JacksonException e) {
            throw new SpeechException("SAI_DINH_DANG");
        }
    }

    private String assessmentHeader(String vanBanMau) {
        Map<String, Object> config = new LinkedHashMap<>();
        config.put("ReferenceText", vanBanMau);
        config.put("GradingSystem", "HundredMark");
        config.put("Granularity", "Word");
        config.put("Dimension", "Comprehensive");
        config.put("EnableMiscue", true);
        return Base64.getEncoder().encodeToString(json.writeValueAsString(config).getBytes(StandardCharsets.UTF_8));
    }

    static ChiSoPhatAm parse(JsonNode root) {
        if (root == null || !root.isObject()) {
            throw new SpeechException("SAI_DINH_DANG");
        }
        String status = text(root.path("RecognitionStatus"));
        if (status != null && NO_SPEECH.contains(status)) {
            return ChiSoPhatAm.empty();
        }
        if (!"Success".equals(status)) {
            throw new SpeechException(status == null ? "SAI_DINH_DANG" : "NCC_TRANG_THAI_LOI");
        }
        JsonNode best = root.path("NBest").path(0);
        if (!best.isObject()) {
            return ChiSoPhatAm.empty();
        }
        List<ChiSoTu> words = new ArrayList<>();
        for (JsonNode word : best.path("Words")) {
            if (words.size() == MAX_WORDS) {
                break;
            }
            String tu = text(word.path("Word"));
            if (tu != null) {
                words.add(new ChiSoTu(tu, score(word, "AccuracyScore"), loi(text(assessment(word, "ErrorType")))));
            }
        }
        String display = text(best.path("Display"));
        return new ChiSoPhatAm(
                score(best, "PronScore"),
                score(best, "AccuracyScore"),
                score(best, "FluencyScore"),
                score(best, "CompletenessScore"),
                display != null ? display : text(root.path("DisplayText")),
                words);
    }

    private static JsonNode assessment(JsonNode node, String field) {
        JsonNode nested = node.path("PronunciationAssessment").path(field);
        return nested.isMissingNode() ? node.path(field) : nested;
    }

    private static Double score(JsonNode node, String field) {
        JsonNode value = assessment(node, field);
        if (!value.isNumber()) {
            return null;
        }
        double score = value.asDouble();
        return Double.isFinite(score) && score >= 0 && score <= 100 ? score : null;
    }

    private static String text(JsonNode node) {
        return node.isString() && !node.asString().isBlank() ? node.asString() : null;
    }

    private static LoiPhatAm loi(String errorType) {
        if (errorType == null) {
            return null;
        }
        return switch (errorType) {
            case "None" -> LoiPhatAm.KHONG;
            case "Mispronunciation" -> LoiPhatAm.SAI;
            case "Omission" -> LoiPhatAm.BO_SOT;
            case "Insertion" -> LoiPhatAm.THUA;
            default -> LoiPhatAm.KHAC;
        };
    }
}
