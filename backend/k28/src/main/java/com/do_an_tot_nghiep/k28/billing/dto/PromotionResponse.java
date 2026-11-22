package com.do_an_tot_nghiep.k28.billing.dto;

import com.do_an_tot_nghiep.k28.billing.entity.enums.ChuKy;
import com.do_an_tot_nghiep.k28.billing.entity.enums.LoaiGiam;
import java.time.Instant;

public record PromotionResponse(
        String id,
        String ma,
        String ten,
        LoaiGiam loaiGiam,
        long giaTri,
        String goiMa,
        ChuKy chuKy,
        Instant batDauAt,
        Instant ketThucAt,
        Integer tongLuot,
        int luotMoiNguoi,
        boolean chiLanDau,
        boolean hoatDong,
        long soLuotDaDung,
        Long version
) {
}
