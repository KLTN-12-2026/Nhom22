package com.do_an_tot_nghiep.k28.engagement.dto;

import com.do_an_tot_nghiep.k28.engagement.entity.enums.*;

public record AdminBadgeResponse(String id, String ma, String ten, String moTa,
        LoaiDieuKienHuyHieu loaiDieuKien, int nguong, int thuTu, boolean hoatDong, Long version) {
}
