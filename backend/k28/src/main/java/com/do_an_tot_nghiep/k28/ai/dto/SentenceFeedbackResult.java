package com.do_an_tot_nghiep.k28.ai.dto;

import java.util.List;

public record SentenceFeedbackResult(
        String cauGoc,
        String cauSua,
        boolean dungTuMucTieu,
        List<LoiCau> loi,
        String nhanXet,
        String cachDungTu
) {

    public record LoiCau(String loai, String doanGoc, String doanSua, String giaiThich) {
    }
}
