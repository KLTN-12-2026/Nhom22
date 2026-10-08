package com.do_an_tot_nghiep.k28.content.dto;

import java.util.List;

public record LibraryCardResponse(
        String id,
        String boTheId,
        String tu,
        String tuLoai,
        String nghiaVi,
        String phienAm,
        String viDuEn,
        String dichVi,
        int doKho,
        String nguon,
        List<String> nhanIds,
        String anhId,
        String amTuId,
        String amCauId
) {
}