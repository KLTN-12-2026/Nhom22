package com.do_an_tot_nghiep.k28.common.quota;

import com.do_an_tot_nghiep.k28.common.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class QuotaController {

    private final QuotaService quota;
    private final CurrentUser currentUser;

    @GetMapping("/api/v1/me/service-quota")
    public ServiceQuotaResponse serviceQuota() {
        return quota.status(currentUser.id());
    }
}
