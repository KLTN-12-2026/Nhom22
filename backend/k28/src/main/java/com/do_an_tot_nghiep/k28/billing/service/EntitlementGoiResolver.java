package com.do_an_tot_nghiep.k28.billing.service;

import com.do_an_tot_nghiep.k28.billing.config.BillingProperties;
import com.do_an_tot_nghiep.k28.billing.entity.DangKyGoi;
import com.do_an_tot_nghiep.k28.common.quota.GoiDichVuResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class EntitlementGoiResolver implements GoiDichVuResolver {

    private final EntitlementService entitlements;
    private final BillingProperties props;

    @Override
    public String goiMa(Long nguoiDungId) {
        return entitlements.current(nguoiDungId)
                .map(DangKyGoi::getGoiMa)
                .orElse(props.enforce() ? null : EntitlementService.GOI_MAC_DINH_KHI_TAT);
    }
}
