package com.do_an_tot_nghiep.k28.ai.dto;

import com.do_an_tot_nghiep.k28.ai.entity.enums.LoaiYeuCauAi;
import com.do_an_tot_nghiep.k28.ai.entity.enums.TrangThaiYeuCauAi;
import java.time.Instant;
import java.util.List;
import tools.jackson.databind.JsonNode;

public record AiRequestResponse(
        String id,
        LoaiYeuCauAi loai,
        TrangThaiYeuCauAi trangThai,
        String maLoi,
        boolean moPhong,
        String nhaCungCap,
        String model,
        String phienBanPrompt,
        Instant createdAt,
        boolean anKiemDuyet,
        List<CardDraftResponse> banNhap,
        JsonNode ketQua
) {
}
