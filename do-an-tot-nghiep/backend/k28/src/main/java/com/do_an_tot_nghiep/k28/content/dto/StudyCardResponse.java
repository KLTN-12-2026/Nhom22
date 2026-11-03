package com.do_an_tot_nghiep.k28.content.dto;

public record StudyCardResponse(
        String id,
        String boTheId,
        String tu,
        String tuLoai,
        String phienAm,
        String nghiaVi,
        String viDuEn,
        String dichVi,
        String anhId,
        String amTuId,
        String amCauId,
        Long version
) {
}