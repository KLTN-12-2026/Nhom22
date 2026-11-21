package com.do_an_tot_nghiep.k28.ai.config;

import java.net.http.HttpClient;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties({AiProperties.class, ImageProperties.class})
public class AiConfig {

    @Bean
    @ConditionalOnProperty(name = "app.ai.provider", havingValue = "openai")
    RestClient openAiRestClient(AiProperties props) {
        AiProperties.OpenAi openai = props.openai();
        if (openai.apiKey() == null || openai.apiKey().isBlank()) {
            throw new IllegalStateException("OPENAI_API_KEY is required when app.ai.provider=openai");
        }
        HttpClient http = HttpClient.newBuilder()
                .connectTimeout(openai.connectTimeout())
                .followRedirects(HttpClient.Redirect.NEVER)
                .build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(http);
        factory.setReadTimeout(openai.readTimeout());
        return RestClient.builder()
                .baseUrl(openai.baseUrl())
                .requestFactory(factory)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + openai.apiKey())
                .build();
    }

    @Bean
    @ConditionalOnProperty(name = "app.ai.image.provider", havingValue = "imagen")
    RestClient imagenRestClient(ImageProperties props) {
        ImageProperties.Imagen imagen = props.imagen();
        if (imagen == null || imagen.apiKey() == null || imagen.apiKey().isBlank()) {
            throw new IllegalStateException("GOOGLE_AI_API_KEY is required when app.ai.image.provider=imagen");
        }
        HttpClient http = HttpClient.newBuilder()
                .connectTimeout(imagen.connectTimeout())
                .followRedirects(HttpClient.Redirect.NEVER)
                .build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(http);
        factory.setReadTimeout(imagen.readTimeout());
        return RestClient.builder()
                .baseUrl(imagen.baseUrl())
                .requestFactory(factory)
                .defaultHeader("x-goog-api-key", imagen.apiKey())
                .build();
    }
}
