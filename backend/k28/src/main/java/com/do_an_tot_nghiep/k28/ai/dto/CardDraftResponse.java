package com.do_an_tot_nghiep.k28.ai.dto;

import com.do_an_tot_nghiep.k28.ai.entity.enums.TrangThaiDuyet;

public record CardDraftResponse(
        String id,
        int thuTu,
        String tu,
        String tuLoai,
        String nghiaVi,
        String viDuEn,
        String dichVi,
        boolean trung,
        String theTrungId,
        TrangThaiDuyet trangThaiDuyet,
        String theDaLuuId
) {
}
