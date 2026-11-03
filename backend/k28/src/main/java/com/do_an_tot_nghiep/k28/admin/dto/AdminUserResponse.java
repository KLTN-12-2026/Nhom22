package com.do_an_tot_nghiep.k28.admin.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.Set;

public record AdminUserResponse(
        String id,
        String email,
        String tenHienThi,
        String trangThai,
        Set<String> vaiTro,
        Instant createdAt,
        Instant dangNhapCuoiAt,
        int soBoThe,
        @JsonInclude(JsonInclude.Include.NON_NULL)
        Integer soPhienDaHuy,
        @JsonInclude(JsonInclude.Include.NON_NULL)
        Boolean banThanMatQuyen
) {
}
