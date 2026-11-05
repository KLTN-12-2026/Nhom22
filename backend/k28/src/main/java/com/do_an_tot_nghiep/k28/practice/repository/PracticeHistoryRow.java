package com.do_an_tot_nghiep.k28.practice.repository;

import com.do_an_tot_nghiep.k28.practice.entity.enums.LoaiBai;
import com.do_an_tot_nghiep.k28.practice.entity.enums.NguonBaiLuyen;
import java.time.Instant;

public record PracticeHistoryRow(
        Long lanLamId,
        Long baiLuyenId,
        LoaiBai loaiBai,
        NguonBaiLuyen nguon,
        String boTheTen,
        int soCauDung,
        int tongSoCau,
        int diem,
        int thoiGian,
        Instant nopAt,
        boolean laLuyenLai
) {
}
