package com.do_an_tot_nghiep.k28.admin.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record AdminUserDetailResponse(
        AdminUserResponse nguoiDung,
        String muiGio,
        Instant emailXacThucAt,
        HocTap hocTap,
        DangKy goiHienTai,
        List<DangKy> lichSuGoi,
        ThanhToan thanhToan,
        List<DichVu> dichVu,
        List<BoThe> boThe,
        BaoCao baoCao
) {

    public record HocTap(
            long soTheDaHoc,
            long soTheDenHan,
            long soTheTamNgung,
            long luotOn,
            Double tyLeNho,
            int soNgayHoc,
            int chuoiNgay,
            LocalDate hocCuoiNgay,
            List<Ngay> theoNgay
    ) {
    }

    public record Ngay(LocalDate ngay, long luotOn, long theMoi) {
    }

    public record DangKy(
            String id,
            String goiMa,
            String tenGoi,
            String trangThai,
            Instant batDauAt,
            Instant hetHanAt,
            Instant huyAt
    ) {
    }

    public record ThanhToan(long tongDaChi, long soThanhCong, long soThatBai, List<GiaoDich> ganDay) {
    }

    public record GiaoDich(
            String id,
            String maDon,
            String goiMa,
            String chuKy,
            long soTien,
            String trangThai,
            Instant taoAt,
            Instant hoanTatAt
    ) {
    }

    public record DichVu(String loai, long soDung, BigDecimal chiPhi) {
    }

    public record BoThe(String id, String ten, String quyenTruyCap, long soThe, Instant updatedAt) {
    }

    public record BaoCao(long daGui, long biBaoCao, long biBaoCaoChoXuLy) {
    }
}
