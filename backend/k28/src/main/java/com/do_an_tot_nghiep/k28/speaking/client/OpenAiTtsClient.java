package com.do_an_tot_nghiep.k28.speaking.client;

import com.do_an_tot_nghiep.k28.speaking.config.TtsProperties;
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

@Slf4j
@Component
@ConditionalOnProperty(name = "app.tts.provider", havingValue = "openai")
public class OpenAiTtsClient implements TtsClient {

    private static final String MIME_TYPE = "audio/mpeg";

    private final RestClient rest;
    private final TtsProperties props;

    public OpenAiTtsClient(@Qualifier("openAiTtsRestClient") RestClient rest, TtsProperties props) {
        this.rest = rest;
        this.props = props;
    }

    @Override
    public String nhaCungCap() {
        return "openai";
    }

    @Override
    public String model() {
        return props.model();
    }

    @Override
    public String giong() {
        return props.giong();
    }

    @Override
    public TtsResult docVanBan(String vanBan) {
        byte[] audio;
        try {
            audio = rest.post()
                    .uri("/audio/speech")
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.ALL)
                    .body(Map.of(
                            "model", props.model(),
                            "voice", props.giong(),
                            "input", vanBan,
                            "response_format", "mp3"))
                    .retrieve()
                    .body(byte[].class);
        } catch (RestClientResponseException e) {
            log.warn("OpenAI TTS returned HTTP {}", e.getStatusCode().value());
            throw new TtsException(e.getStatusCode().is5xxServerError() ? "NCC_LOI_5XX"
                    : e.getStatusCode().value() == 429 ? "NCC_GIOI_HAN" : "NCC_TU_CHOI");
        } catch (ResourceAccessException e) {
            log.warn("OpenAI TTS connection failed: {}", e.getClass().getSimpleName());
            throw new TtsException("TIMEOUT");
        } catch (RestClientException e) {
            log.warn("OpenAI TTS call ended without a readable result: {}", e.getClass().getSimpleName());
            throw new TtsException("MAT_KET_NOI");
        }
        if (!isMp3(audio) || audio.length > props.maxBytes()) {
            throw new TtsException("SAI_DINH_DANG");
        }
        return new TtsResult(audio, MIME_TYPE, false);
    }

    private boolean isMp3(byte[] audio) {
        if (audio == null || audio.length < 4) {
            return false;
        }
        boolean id3 = audio[0] == 'I' && audio[1] == 'D' && audio[2] == '3';
        boolean frame = (audio[0] & 0xFF) == 0xFF && (audio[1] & 0xE0) == 0xE0;
        return id3 || frame;
    }
}
