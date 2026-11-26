package com.do_an_tot_nghiep.k28.practice.dto;

import com.do_an_tot_nghiep.k28.practice.entity.enums.NhomLoi;
import java.util.List;
import java.util.Map;
import tools.jackson.databind.JsonNode;

public record PracticeCheckResponse(
        String cauHoiId,
        boolean dung,
        NhomLoi nhomLoi,
        JsonNode traLoi,
        Map<String, Object> dapAn,
        JsonNode giaiThich,
        List<Map<String, Object>> cap
) {
}
