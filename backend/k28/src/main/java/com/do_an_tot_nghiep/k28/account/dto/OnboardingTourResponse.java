package com.do_an_tot_nghiep.k28.account.dto;

import com.do_an_tot_nghiep.k28.account.entity.enums.BuocHuongDan;

public record OnboardingTourResponse(
        BuocHuongDan buocHuongDan,
        String boKhoiDongId,
        String boSaoChepId,
        String boKhoiDongNguonId
) {
}
