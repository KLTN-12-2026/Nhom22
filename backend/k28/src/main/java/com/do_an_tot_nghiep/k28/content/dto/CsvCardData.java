package com.do_an_tot_nghiep.k28.content.dto;

import java.util.List;

public record CsvCardData(
        String tu,
        String tuLoai,
        String nghiaVi,
        String phienAm,
        String viDuEn,
        String dichVi,
        Integer doKho,
        String nguon,
        List<String> nhanIds
) {
}
