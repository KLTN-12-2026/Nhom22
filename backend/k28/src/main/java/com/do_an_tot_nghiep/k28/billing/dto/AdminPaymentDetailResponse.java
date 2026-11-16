package com.do_an_tot_nghiep.k28.billing.dto;

import java.util.Map;

public record AdminPaymentDetailResponse(
        AdminPaymentResponse giaoDich,
        Map<String, String> duLieuCong
) {
}
