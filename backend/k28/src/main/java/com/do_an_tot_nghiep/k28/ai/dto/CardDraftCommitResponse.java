package com.do_an_tot_nghiep.k28.ai.dto;

import java.util.List;

public record CardDraftCommitResponse(
        String yeuCauId,
        String boTheId,
        boolean boMoi,
        int soTheDaLuu,
        List<ResultItem> ketQua
) {
    public record ResultItem(String banNhapId, String theId, boolean trung, List<String> theTrungIds) {
    }
}
