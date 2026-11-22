package com.do_an_tot_nghiep.k28.dictionary.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.core.io.Resource;

@ConfigurationProperties("app.dictionary")
public record DictionaryProperties(
        boolean importOnStartup,
        int batchSize,
        Resource anhViet,
        Resource vietAnh
) {
}
