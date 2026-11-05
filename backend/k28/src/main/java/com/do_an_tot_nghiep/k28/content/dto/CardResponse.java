package com.do_an_tot_nghiep.k28.content.dto;

import java.time.Instant;
import java.util.List;

public record CardResponse(
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
        String amCauId,
        boolean trung,
        List<String> theTrungIds,
        Instant createdAt,
        Instant updatedAt,
        Long version
) {
}