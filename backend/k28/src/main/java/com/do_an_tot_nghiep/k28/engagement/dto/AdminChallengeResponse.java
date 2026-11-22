package com.do_an_tot_nghiep.k28.engagement.dto;

import com.do_an_tot_nghiep.k28.engagement.entity.enums.*;

public record AdminChallengeResponse(String id, String ma, String ten, String moTa,
        LoaiDieuKienThuThach loaiDieuKien, ChuKyThuThach chuKy, int mucTieu, boolean hoatDong, Long version) {
}
