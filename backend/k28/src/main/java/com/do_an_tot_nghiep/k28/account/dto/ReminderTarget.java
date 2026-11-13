package com.do_an_tot_nghiep.k28.account.dto;

import java.time.LocalTime;

public record ReminderTarget(
        Long id,
        String email,
        String tenHienThi,
        String muiGio,
        LocalTime gioNhac,
        boolean nhanTrongUngDung,
        boolean nhanEmail
) {
}
