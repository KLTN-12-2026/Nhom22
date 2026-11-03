package com.do_an_tot_nghiep.k28.account.dto;

import java.time.Instant;
import java.util.Set;

public record UserAdminView(
        String id,
        String email,
        String tenHienThi,
        String trangThai,
        Set<String> vaiTro,
        Instant createdAt,
        Instant dangNhapCuoiAt
) {
}
