package com.do_an_tot_nghiep.k28.privacy.dto;

import com.do_an_tot_nghiep.k28.privacy.entity.enums.TrangThaiYeuCauXoa;
import java.time.Instant;

public record DeletionRequestResponse(
        String id,
        String phamVi,
        TrangThaiYeuCauXoa trangThai,
        Instant yeuCauAt
) {
}
