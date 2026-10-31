package com.do_an_tot_nghiep.k28.practice.dto;

import com.do_an_tot_nghiep.k28.practice.entity.enums.LoaiCau;
import tools.jackson.databind.JsonNode;

public record PracticeQuestionResponse(
        String id,
        int thuTu,
        LoaiCau loaiCau,
        JsonNode deBai,
        JsonNode phuongAn
) {
}
