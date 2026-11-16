package com.do_an_tot_nghiep.k28.ai.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("app.ai.image")
public record ImageProperties(String provider, int maxBytes) {
}
