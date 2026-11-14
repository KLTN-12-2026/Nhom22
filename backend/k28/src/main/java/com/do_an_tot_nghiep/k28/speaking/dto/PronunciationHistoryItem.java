package com.do_an_tot_nghiep.k28.speaking.dto;

import com.do_an_tot_nghiep.k28.speaking.entity.enums.TrangThaiPhatAm;
import java.time.Instant;

public record PronunciationHistoryItem(
        String id,
        String theId,
        String vanBanMau,
        String nhaCungCap,
        boolean moPhong,
        TrangThaiPhatAm trangThai,
        Double tongDiem,
        Double doChinhXac,
        Double doTroiChay,
        Double doDayDu,
        String tepGhiAmId,
        Instant createdAt
) {
}
