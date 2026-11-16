package com.do_an_tot_nghiep.k28.account.dto;

import com.do_an_tot_nghiep.k28.account.entity.enums.TrangThaiNguoiDung;

public record NotificationContact(
        Long id,
        String email,
        String tenHienThi,
        String muiGio,
        TrangThaiNguoiDung trangThai,
        Boolean nhanEmail
) {

    public boolean emailBat() {
        return !Boolean.FALSE.equals(nhanEmail);
    }
}
