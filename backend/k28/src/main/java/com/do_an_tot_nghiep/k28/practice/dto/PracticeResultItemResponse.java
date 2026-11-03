package com.do_an_tot_nghiep.k28.practice.dto;

import com.do_an_tot_nghiep.k28.practice.entity.enums.LoaiCau;
import com.do_an_tot_nghiep.k28.practice.entity.enums.NhomLoi;
import java.util.List;
import java.util.Map;
import tools.jackson.databind.JsonNode;

public record PracticeResultItemResponse(
        String cauHoiId,
        int thuTu,
        LoaiCau loaiCau,
        String theId,
        JsonNode deBai,
        JsonNode phuongAn,
        JsonNode traLoi,
        Map<String, Object> dapAn,
        boolean dung,
        int diem,
        NhomLoi nhomLoi,
        List<Map<String, Object>> chiTiet,
        JsonNode giaiThich
) {
}
