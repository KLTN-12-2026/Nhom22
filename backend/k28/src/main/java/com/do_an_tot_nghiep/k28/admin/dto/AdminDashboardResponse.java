package com.do_an_tot_nghiep.k28.admin.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record AdminDashboardResponse(
        String muiGio,
        int soNgay,
        LocalDate tuNgay,
        LocalDate denNgay,
        Instant capNhatAt,
        ChiSo chiSo,
        List<Ngay> theoNgay,
        List<Thang> doanhThuTheoThang,
        List<Goi> coCauGoi,
        CanXuLy canXuLy,
        List<BoMau> boMauNoiBat,
        List<NguoiDungMoi> nguoiDungMoi,
        ServiceUsageResponse dichVuHomNay,
        List<AuditLogResponse> nhatKyGanDay,
        HeThong heThong
) {

    public record ChiSo(
            long tongNguoiDung,
            long dangHoatDong,
            long biKhoa,
            long chuaXacThuc,
            long soQuanTri,
            long nguoiDungMoi,
            long nguoiDungMoiKyTruoc,
            long hoatDongHomNay,
            long hoatDongHomQua,
            long nguoiHocTrongKy,
            long luotOnTrongKy,
            long luotOnKyTruoc,
            Double tyLeNho,
            long thueBaoHieuLuc,
            long doanhThuThangNay,
            long doanhThuThangTruoc
    ) {
    }

    public record Ngay(LocalDate ngay, long dangKy, long nguoiHoc, long luotOn, Double tyLeNho) {
    }

    public record Thang(String thang, long doanhThu, long soGiaoDich) {
    }

    public record Goi(String goiMa, String ten, long soNguoi) {
    }

    public record CanXuLy(
            long congKhaiChoDuyet,
            Instant congKhaiCuNhatAt,
            long baoCaoChoXuLy,
            long thueBaoSapHetHan,
            long giaoDichTreo,
            long chuaXacThucQua48h,
            long tacVuLoi24h,
            long hoTroDangMo
    ) {
    }

    public record BoMau(String id, String ten, long soNguoiHoc, long soLuotOn, Double tyLeNho) {
    }

    public record NguoiDungMoi(String id, String email, String tenHienThi, String trangThai, Instant createdAt, String goiMa) {
    }

    public record HeThong(String csdl, String redis, long tacVuCho, long tacVuLoi24h) {
    }
}
