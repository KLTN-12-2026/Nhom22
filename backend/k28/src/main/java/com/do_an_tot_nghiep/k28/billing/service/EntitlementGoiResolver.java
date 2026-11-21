package com.do_an_tot_nghiep.k28.billing.service;

import com.do_an_tot_nghiep.k28.common.quota.GoiDichVuResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class EntitlementGoiResolver implements GoiDichVuResolver {

    private final EntitlementService entitlements;

    @Override
    public String goiMa(Long nguoiDungId) {
        return entitlements.planCode(nguoiDungId).orElse(null);
    }
}
