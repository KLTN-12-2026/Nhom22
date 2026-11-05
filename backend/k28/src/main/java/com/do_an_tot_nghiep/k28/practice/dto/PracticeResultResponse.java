package com.do_an_tot_nghiep.k28.practice.dto;

import com.do_an_tot_nghiep.k28.practice.entity.enums.LoaiBai;
import java.time.Instant;
import java.util.List;

public record PracticeResultResponse(
        String lanLamId,
        String baiLuyenId,
        LoaiBai loaiBai,
        String boTheId,
        String boTheTen,
        boolean laLuyenLai,
        int soCauDung,
        int tongSoCau,
        int diem,
        int thoiGian,
        Instant nopAt,
        List<SkillScoreResponse> theoKyNang,
        List<PracticeResultItemResponse> ketQua
) {
}
