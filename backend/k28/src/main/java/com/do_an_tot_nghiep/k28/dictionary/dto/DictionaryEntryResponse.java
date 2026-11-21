package com.do_an_tot_nghiep.k28.dictionary.dto;

import com.do_an_tot_nghiep.k28.dictionary.entity.enums.ChieuTuDien;
import com.fasterxml.jackson.annotation.JsonRawValue;

public record DictionaryEntryResponse(
        String id,
        ChieuTuDien chieu,
        String tu,
        String phienAm,
        String tomTat,
        @JsonRawValue String noiDung
) {
}
