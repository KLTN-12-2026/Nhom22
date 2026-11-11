package com.do_an_tot_nghiep.k28.engagement.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties("app.rewards")
public record RewardProperties(
        @DefaultValue("100") int diemToiDaNgay,
        @DefaultValue("1") int diemMoiLuotOn,
        @DefaultValue("1") int diemMoiCauDung
) {
}
