package com.do_an_tot_nghiep.k28.ai.dto;

public record CardDraftData(
        String tu,
        String tuLoai,
        String nghiaVi,
        String viDuEn,
        String dichVi,
        boolean trung,
        String theTrungId
) {
    public CardDraftData danhDauTrung(Long theId) {
        return new CardDraftData(tu, tuLoai, nghiaVi, viDuEn, dichVi, true, theId.toString());
    }
}
