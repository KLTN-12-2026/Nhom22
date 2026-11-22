package com.do_an_tot_nghiep.k28.billing.dto;

import com.do_an_tot_nghiep.k28.billing.entity.enums.MaUuDai;
import java.util.List;

public record OfferResponse(
        MaUuDai ma,
        String goiMa,
        String tenGoi,
        int phanTramGiam,
        int soNgay,
        Integer soSuatToiDa,
        List<String> tenMien,
        boolean hoatDong,
        long soSuatDaDung,
        Long version
) {
}
