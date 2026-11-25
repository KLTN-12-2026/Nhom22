package com.do_an_tot_nghiep.k28.support.dto;

import com.do_an_tot_nghiep.k28.support.entity.enums.DoUuTien;
import com.do_an_tot_nghiep.k28.support.entity.enums.LoaiVanDe;
import com.do_an_tot_nghiep.k28.support.entity.enums.TrangThaiPhieu;
import java.time.Instant;
import java.util.List;

public record TicketResponse(
        String id,
        String tieuDe,
        String moTa,
        LoaiVanDe loaiVanDe,
        DoUuTien doUuTien,
        TrangThaiPhieu trangThai,
        Long version,
        Instant createdAt,
        Instant updatedAt,
        NguoiDung nguoiDung,
        List<PhanHoi> phanHoi
) {

    public TicketResponse with(NguoiDung nguoiDung, List<PhanHoi> phanHoi) {
        return new TicketResponse(id, tieuDe, moTa, loaiVanDe, doUuTien, trangThai, version,
                createdAt, updatedAt, nguoiDung, phanHoi);
    }

    public record NguoiDung(String id, String tenHienThi, String email) {
    }

    public record PhanHoi(String id, String nguoiXuLy, String noiDung, String hanhDong, Instant createdAt) {
    }
}
