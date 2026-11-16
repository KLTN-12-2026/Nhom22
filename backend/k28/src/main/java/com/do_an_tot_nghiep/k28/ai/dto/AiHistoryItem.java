package com.do_an_tot_nghiep.k28.ai.dto;

import com.do_an_tot_nghiep.k28.ai.entity.enums.LoaiYeuCauAi;
import com.do_an_tot_nghiep.k28.ai.entity.enums.TrangThaiYeuCauAi;
import java.time.Instant;

public record AiHistoryItem(
        String id,
        LoaiYeuCauAi loai,
        TrangThaiYeuCauAi trangThai,
        String maLoi,
        String inputRef,
        boolean moPhong,
        String nhaCungCap,
        boolean anKiemDuyet,
        Instant createdAt
) {
}
