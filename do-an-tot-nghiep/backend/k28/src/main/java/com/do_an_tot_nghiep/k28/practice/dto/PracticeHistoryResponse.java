package com.do_an_tot_nghiep.k28.practice.dto;

import com.do_an_tot_nghiep.k28.practice.entity.enums.LoaiBai;
import java.time.Instant;

public record PracticeHistoryResponse(
        String lanLamId,
        String baiLuyenId,
        LoaiBai loaiBai,
        String boTheTen,
        int soCauDung,
        int tongSoCau,
        int soCauSai,
        int diem,
        int thoiGian,
        Instant nopAt,
        boolean laLuyenLai
) {
}
