package com.do_an_tot_nghiep.k28.dictionary.dto;

import com.do_an_tot_nghiep.k28.dictionary.entity.enums.ChieuTuDien;
import java.util.List;

public record DictionaryLookupResponse(
        String q,
        ChieuTuDien chieu,
        List<DictionaryEntryResponse> ketQua,
        List<DictionarySuggestionResponse> goiY
) {
}
