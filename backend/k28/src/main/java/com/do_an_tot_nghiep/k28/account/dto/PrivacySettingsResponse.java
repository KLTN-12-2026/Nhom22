package com.do_an_tot_nghiep.k28.account.dto;

public record PrivacySettingsResponse(
        boolean congKhaiHoatDong,
        boolean thamGiaXepHang,
        Long version
) {
}
