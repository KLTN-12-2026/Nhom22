package com.do_an_tot_nghiep.k28.moderation.dto;

import com.do_an_tot_nghiep.k28.moderation.entity.enums.LoaiDoiTuongBaoCao;
import com.do_an_tot_nghiep.k28.moderation.entity.enums.LyDoBaoCao;
import com.do_an_tot_nghiep.k28.moderation.entity.enums.TrangThaiBaoCao;
import java.time.Instant;

public record ReportResponse(
        String id,
        LoaiDoiTuongBaoCao loaiDoiTuong,
        String doiTuongId,
        LyDoBaoCao lyDo,
        String moTa,
        TrangThaiBaoCao trangThai,
        Instant createdAt
) {
}
