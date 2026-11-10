package com.do_an_tot_nghiep.k28.common.quota;

import java.time.ZoneId;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("app.quota")
public record QuotaProperties(ZoneId zone) {
}
