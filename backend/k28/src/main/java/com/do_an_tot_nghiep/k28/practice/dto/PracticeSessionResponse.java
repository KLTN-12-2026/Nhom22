package com.do_an_tot_nghiep.k28.practice.dto;

import com.do_an_tot_nghiep.k28.practice.entity.enums.LoaiBai;
import com.do_an_tot_nghiep.k28.practice.entity.enums.NguonBaiLuyen;
import java.time.Instant;
import java.util.List;

public record PracticeSessionResponse(
        String id,
        LoaiBai loaiBai,
        String boTheId,
        String boTheTen,
        NguonBaiLuyen nguon,
        int soCau,
        int soCauYeuCau,
        Instant createdAt,
        List<PracticeQuestionResponse> cauHoi
) {
}
