package com.do_an_tot_nghiep.k28.admin.dto;

import com.do_an_tot_nghiep.k28.admin.entity.enums.HanhDongQuanTri;
import com.do_an_tot_nghiep.k28.admin.entity.enums.LoaiDoiTuong;
import java.time.Instant;
import tools.jackson.databind.JsonNode;

public record AuditLogResponse(
        String id,
        NguoiThucHien nguoiThucHien,
        HanhDongQuanTri hanhDong,
        DoiTuong doiTuong,
        String lyDo,
        JsonNode truoc,
        JsonNode sau,
        Instant createdAt
) {

    public record NguoiThucHien(String id, String tenHienThi) {
    }

    public record DoiTuong(LoaiDoiTuong loai, String id, String ten) {
    }
}
