package com.do_an_tot_nghiep.k28.speaking.config;

import java.net.http.HttpClient;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(SpeechProperties.class)
public class SpeechConfig {

    @Bean
    @ConditionalOnProperty(name = "app.speech.provider", havingValue = "azure")
    RestClient azureSpeechRestClient(SpeechProperties props) {
        SpeechProperties.Azure azure = props.azure();
        if (azure.apiKey() == null || azure.apiKey().isBlank()) {
            throw new IllegalStateException("AZURE_SPEECH_KEY is required when app.speech.provider=azure");
        }
        if (azure.region() == null || !azure.region().matches("[a-z0-9]+")) {
            throw new IllegalStateException("AZURE_SPEECH_REGION must be an Azure region name");
        }
        HttpClient http = HttpClient.newBuilder()
                .connectTimeout(props.connectTimeout())
                .followRedirects(HttpClient.Redirect.NEVER)
                .build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(http);
        factory.setReadTimeout(props.readTimeout());
        return RestClient.builder()
                .baseUrl("https://" + azure.region() + ".stt.speech.microsoft.com")
                .requestFactory(factory)
                .defaultHeader("Ocp-Apim-Subscription-Key", azure.apiKey())
                .build();
    }
}
