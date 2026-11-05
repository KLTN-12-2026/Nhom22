package com.do_an_tot_nghiep.k28.common.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
@ConditionalOnProperty(name = "app.files.cleanup.enabled", havingValue = "true", matchIfMissing = true)
public class FileCleanupConfig {
}
