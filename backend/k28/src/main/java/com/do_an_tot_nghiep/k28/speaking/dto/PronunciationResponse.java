package com.do_an_tot_nghiep.k28.speaking.dto;

import com.do_an_tot_nghiep.k28.content.dto.FileResponse;
import com.do_an_tot_nghiep.k28.speaking.entity.enums.TrangThaiPhatAm;
import java.time.Instant;

public record PronunciationResponse(
        String id,
        String theId,
        String vanBanMau,
        String ngonNgu,
        String nhaCungCap,
        boolean moPhong,
        TrangThaiPhatAm trangThai,
        ChiSoPhatAm chiSo,
        int thoiLuongGhiMs,
        FileResponse ghiAm,
        SoSanhPhatAm soSanh,
        Instant createdAt
) {
}
