package com.do_an_tot_nghiep.k28.practice.dto;

import com.do_an_tot_nghiep.k28.practice.entity.enums.KyNang;

public record SkillScoreResponse(
        KyNang kyNang,
        int dung,
        int tong
) {
}
