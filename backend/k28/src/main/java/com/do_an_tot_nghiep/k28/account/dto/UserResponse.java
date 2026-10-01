package com.do_an_tot_nghiep.k28.account.dto;

import java.time.Instant;
import java.util.Set;

public record UserResponse(
        String id,
        String email,
        String tenHienThi,
        String anhDaiDienId,
        String trangThai,
        String muiGio,
        Instant emailXacThucAt,
        Set<String> vaiTro,
        boolean daHoanTatKhoiDau
) {
}
