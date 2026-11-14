package com.do_an_tot_nghiep.k28.ai.entity;

import com.do_an_tot_nghiep.k28.ai.entity.enums.LoaiYeuCauAi;
import com.do_an_tot_nghiep.k28.ai.entity.enums.TrangThaiHanMuc;
import com.do_an_tot_nghiep.k28.ai.entity.enums.TrangThaiYeuCauAi;
import com.do_an_tot_nghiep.k28.common.entity.BaseEntity;
import com.do_an_tot_nghiep.k28.common.quota.GiuCho;
import com.do_an_tot_nghiep.k28.common.quota.entity.enums.LoaiDichVu;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class YeuCauAi extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, updatable = false)
    private Long nguoiDungId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20, updatable = false)
    private LoaiYeuCauAi loai;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private TrangThaiYeuCauAi trangThai;

    @Column(length = 100)
    private String inputRef;

    @Column(columnDefinition = "json")
    private String ketQuaJson;

    @Column(length = 20)
    private String phienBanPrompt;

    @Column(length = 100)
    private String providerRequestId;

    @Column(length = 30)
    private String nhaCungCap;

    @Column(length = 60)
    private String model;

    private Integer thoiLuongMs;

    private Integer tokenVao;

    private Integer tokenRa;

    @Column(length = 50)
    private String maLoi;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(length = 20)
    private LoaiDichVu hanMucLoai;

    private LocalDate hanMucNgay;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 10)
    private TrangThaiHanMuc hanMucTrangThai;

    public static YeuCauAi taoThe(Long nguoiDungId, String inputRef, String phienBanPrompt,
                                  String nhaCungCap, GiuCho giuCho) {
        YeuCauAi request = new YeuCauAi();
        request.nguoiDungId = nguoiDungId;
        request.loai = LoaiYeuCauAi.TAO_THE;
        request.trangThai = TrangThaiYeuCauAi.CHO;
        request.inputRef = inputRef;
        request.phienBanPrompt = phienBanPrompt;
        request.nhaCungCap = nhaCungCap;
        request.hanMucLoai = giuCho.loai();
        request.hanMucNgay = giuCho.ngay();
        request.hanMucTrangThai = TrangThaiHanMuc.GIU_CHO;
        return request;
    }

    public void batDauXuLy() {
        if (trangThai == TrangThaiYeuCauAi.CHO) {
            trangThai = TrangThaiYeuCauAi.DANG_XU_LY;
        }
    }

    public void ghiCuocGoi(String model, String providerRequestId, int thoiLuongMs, Integer tokenVao, Integer tokenRa) {
        this.model = model;
        this.providerRequestId = providerRequestId;
        this.thoiLuongMs = thoiLuongMs;
        this.tokenVao = tokenVao;
        this.tokenRa = tokenRa;
    }

    public void ghiThoiLuong(int thoiLuongMs) {
        this.thoiLuongMs = thoiLuongMs;
    }

    public void luuKetQua(String ketQuaJson) {
        this.ketQuaJson = ketQuaJson;
    }

    public boolean ketThuc(TrangThaiYeuCauAi ketQua, String maLoi) {
        if (daKetThuc()) {
            return false;
        }
        this.trangThai = ketQua;
        this.maLoi = maLoi;
        return true;
    }

    public boolean chotHanMuc(TrangThaiHanMuc ketQua) {
        if (hanMucTrangThai != TrangThaiHanMuc.GIU_CHO || hanMucLoai == null || hanMucNgay == null) {
            return false;
        }
        hanMucTrangThai = ketQua;
        return true;
    }

    public GiuCho giuCho() {
        return new GiuCho(hanMucNgay, hanMucLoai);
    }

    public boolean daKetThuc() {
        return trangThai == TrangThaiYeuCauAi.HOAN_TAT
                || trangThai == TrangThaiYeuCauAi.LOI
                || trangThai == TrangThaiYeuCauAi.KHONG_XAC_DINH;
    }

    public boolean isMoPhong() {
        return !"openai".equals(nhaCungCap);
    }
}
