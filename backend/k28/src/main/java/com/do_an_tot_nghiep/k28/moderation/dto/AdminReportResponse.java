package com.do_an_tot_nghiep.k28.moderation.dto;

import com.do_an_tot_nghiep.k28.moderation.entity.enums.LoaiDoiTuongBaoCao;
import com.do_an_tot_nghiep.k28.moderation.entity.enums.LyDoBaoCao;
import com.do_an_tot_nghiep.k28.moderation.entity.enums.TrangThaiBaoCao;
import java.time.Instant;
import tools.jackson.databind.JsonNode;

public record AdminReportResponse(
        String id,
        LoaiDoiTuongBaoCao loaiDoiTuong,
        String doiTuongId,
        LyDoBaoCao lyDo,
        String moTa,
        JsonNode noiDung,
        TrangThaiBaoCao trangThai,
        NguoiDung nguoiBaoCao,
        NguoiDung nguoiXuLy,
        String lyDoXuLy,
        Instant xuLyAt,
        Instant createdAt
) {

    public record NguoiDung(String id, String tenHienThi) {
    }
}
