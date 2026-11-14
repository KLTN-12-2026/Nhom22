package com.do_an_tot_nghiep.k28.practice.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import lombok.Builder;

@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public record RecommendationEvidenceResponse(
        Integer soLanQuen,
        Integer soNgay,
        Integer soSai,
        Integer soLuot,
        String capId,
        Integer soLanNham,
        Integer soQuaHan,
        Integer soDenHan,
        Integer luotMoiNgay,
        Integer phutMoiNgay,
        Integer soNgayKeHoach,
        Integer soLuotCu,
        Integer soSaiCu,
        Integer soNgayCu,
        Integer soLuotMoi,
        Integer soDungMoi,
        Integer soNgayMoi,
        Integer diem,
        Integer diemToiThieu,
        Instant lanCuoiAt
) {
}
