package com.do_an_tot_nghiep.k28.speaking.config;

import com.do_an_tot_nghiep.k28.ai.config.AiProperties;
import java.net.http.HttpClient;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties({TtsProperties.class, AiProperties.class})
public class TtsConfig {

    @Bean
    @ConditionalOnProperty(name = "app.tts.provider", havingValue = "openai")
    RestClient openAiTtsRestClient(AiProperties ai, TtsProperties tts) {
        AiProperties.OpenAi openai = ai.openai();
        if (openai.apiKey() == null || openai.apiKey().isBlank()) {
            throw new IllegalStateException("OPENAI_API_KEY is required when app.tts.provider=openai");
        }
        HttpClient http = HttpClient.newBuilder()
                .connectTimeout(openai.connectTimeout())
                .followRedirects(HttpClient.Redirect.NEVER)
                .build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(http);
        factory.setReadTimeout(tts.readTimeout());
        return RestClient.builder()
                .baseUrl(openai.baseUrl())
                .requestFactory(factory)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + openai.apiKey())
                .build();
    }
}
