package com.do_an_tot_nghiep.k28.billing.dto;

import java.util.List;

public record StudentOfferResponse(
        boolean hoatDong,
        String goiMa,
        String tenGoi,
        int phanTramGiam,
        int soNgay,
        List<String> tenMien,
        StudentVerificationResponse xacMinh,
        boolean coTheNhan
) {
}
