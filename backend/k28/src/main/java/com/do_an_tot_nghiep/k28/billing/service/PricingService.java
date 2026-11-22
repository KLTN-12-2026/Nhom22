package com.do_an_tot_nghiep.k28.billing.service;

import com.do_an_tot_nghiep.k28.billing.entity.ChuongTrinhUuDai;
import com.do_an_tot_nghiep.k28.billing.entity.DangKyGoi;
import com.do_an_tot_nghiep.k28.billing.entity.GoiDichVu;
import com.do_an_tot_nghiep.k28.billing.entity.KhuyenMai;
import com.do_an_tot_nghiep.k28.billing.entity.enums.ChuKy;
import com.do_an_tot_nghiep.k28.billing.entity.enums.MaUuDai;
import com.do_an_tot_nghiep.k28.billing.entity.enums.TrangThaiGiaoDich;
import com.do_an_tot_nghiep.k28.billing.entity.enums.TrangThaiXacMinh;
import com.do_an_tot_nghiep.k28.billing.repository.ChuongTrinhUuDaiRepository;
import com.do_an_tot_nghiep.k28.billing.repository.GiaoDichThanhToanRepository;
import com.do_an_tot_nghiep.k28.billing.repository.GoiDichVuRepository;
import com.do_an_tot_nghiep.k28.billing.repository.KhuyenMaiRepository;
import com.do_an_tot_nghiep.k28.billing.repository.XacMinhHssvRepository;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PricingService {

    static final long SO_TIEN_TOI_THIEU = 5000;

    public record Quote(GoiDichVu goi, ChuKy chuKy, long giaGoc, long giamGia, long khauTru, long soTien,
                        KhuyenMai khuyenMai, boolean uuDaiHssv, boolean nangCap) {
    }

    private final GoiDichVuRepository goiDichVu;
    private final KhuyenMaiRepository khuyenMai;
    private final GiaoDichThanhToanRepository giaoDich;
    private final ChuongTrinhUuDaiRepository uuDai;
    private final XacMinhHssvRepository xacMinh;
    private final EntitlementService entitlements;

    @Transactional(readOnly = true)
    public Quote quote(Long nguoiDungId, String goiMa, ChuKy chuKy, String maKhuyenMai, Instant now) {
        GoiDichVu goi = goiDichVu.findByMaAndHoatDongTrue(goiMa)
                .orElseThrow(() -> new ApiException(ErrorCode.BUSINESS_RULE, "goiMa",
                        "Gói không tồn tại hoặc đã ngừng bán"));
        if (goi.getGiaThang() <= 0) {
            throw new ApiException(ErrorCode.BUSINESS_RULE, "goiMa", "Gói " + goi.getTen()
                    + " miễn phí, bạn không cần mua");
        }
        long giaGoc = goi.gia(chuKy);
        boolean nangCap = false;
        long khauTru = 0;
        Optional<DangKyGoi> hienTai = entitlements.current(nguoiDungId).filter(DangKyGoi::traPhi);
        if (hienTai.isPresent() && !hienTai.get().getGoiMa().equals(goi.getMa())) {
            DangKyGoi dangKy = hienTai.get();
            GoiDichVu goiHienTai = goiDichVu.findByMa(dangKy.getGoiMa()).orElseThrow();
            if (goi.getGiaThang() <= goiHienTai.getGiaThang()) {
                throw new ApiException(ErrorCode.BUSINESS_RULE, "goiMa", "Bạn đang dùng gói " + goiHienTai.getTen()
                        + ". Hệ thống chỉ cho nâng lên gói cao hơn giữa kỳ, gói thấp hơn mua được sau khi gói hiện tại hết hạn");
            }
            nangCap = true;
            khauTru = credit(nguoiDungId, dangKy, now);
        }

        KhuyenMai apDung = null;
        long giamGia = 0;
        if (maKhuyenMai != null && !maKhuyenMai.isBlank()) {
            KhuyenMai theoMa = khuyenMai.findByMa(maKhuyenMai.strip().toUpperCase(Locale.ROOT))
                    .orElseThrow(() -> new ApiException(ErrorCode.BUSINESS_RULE, "maKhuyenMai",
                            "Mã khuyến mãi không tồn tại"));
            String loi = ineligible(theoMa, nguoiDungId, goi.getMa(), chuKy, now);
            if (loi != null) {
                throw new ApiException(ErrorCode.BUSINESS_RULE, "maKhuyenMai", loi);
            }
            apDung = theoMa;
            giamGia = theoMa.soTienGiam(giaGoc);
        }
        for (KhuyenMai tuDong : khuyenMai.autoActive(now)) {
            long giam = tuDong.soTienGiam(giaGoc);
            if (giam > giamGia && ineligible(tuDong, nguoiDungId, goi.getMa(), chuKy, now) == null) {
                apDung = tuDong;
                giamGia = giam;
            }
        }
        boolean uuDaiHssv = false;
        long giamHssv = studentDiscount(nguoiDungId, goi.getMa(), giaGoc, now);
        if (giamHssv > giamGia) {
            apDung = null;
            giamGia = giamHssv;
            uuDaiHssv = true;
        }

        long soTien = giaGoc - giamGia - khauTru;
        long toiThieu = Math.min(giaGoc, SO_TIEN_TOI_THIEU);
        if (soTien < toiThieu) {
            long thieu = toiThieu - soTien;
            long bot = Math.min(thieu, khauTru);
            khauTru -= bot;
            giamGia -= thieu - bot;
            soTien = toiThieu;
        }
        return new Quote(goi, chuKy, giaGoc, giamGia, khauTru, soTien, apDung, uuDaiHssv, nangCap);
    }

    private String ineligible(KhuyenMai km, Long nguoiDungId, String goiMa, ChuKy chuKy, Instant now) {
        if (!km.apDungDuoc(goiMa, chuKy, now)) {
            return "Mã khuyến mãi đã hết hạn hoặc không áp dụng cho gói và chu kỳ này";
        }
        if (km.isChiLanDau() && giaoDich.existsByNguoiDungIdAndTrangThai(nguoiDungId, TrangThaiGiaoDich.THANH_CONG)) {
            return "Mã khuyến mãi chỉ dành cho lần mua gói đầu tiên";
        }
        if (giaoDich.countByKhuyenMaiIdAndNguoiDungIdAndTrangThai(km.getId(), nguoiDungId,
                TrangThaiGiaoDich.THANH_CONG) >= km.getLuotMoiNguoi()) {
            return "Bạn đã dùng hết lượt của mã khuyến mãi này";
        }
        if (km.getTongLuot() != null
                && giaoDich.countByKhuyenMaiIdAndTrangThai(km.getId(), TrangThaiGiaoDich.THANH_CONG) >= km.getTongLuot()) {
            return "Mã khuyến mãi đã hết lượt sử dụng";
        }
        return null;
    }

    private long studentDiscount(Long nguoiDungId, String goiMa, long giaGoc, Instant now) {
        Optional<ChuongTrinhUuDai> hssv = uuDai.findByMa(MaUuDai.HSSV)
                .filter(ChuongTrinhUuDai::isHoatDong)
                .filter(item -> !item.mienPhi() && item.getGoiMa().equals(goiMa));
        if (hssv.isEmpty()) {
            return 0;
        }
        boolean daXacMinh = xacMinh.findFirstByNguoiDungIdAndTrangThaiOrderByIdDesc(nguoiDungId, TrangThaiXacMinh.DA_DUYET)
                .filter(item -> item.conHieuLuc(now))
                .isPresent();
        return daXacMinh ? giaGoc * hssv.get().getPhanTramGiam() / 100 : 0;
    }

    private long credit(Long nguoiDungId, DangKyGoi dangKy, Instant now) {
        return giaoDich.findFirstByNguoiDungIdAndGoiMaAndTrangThaiOrderByHoanTatAtDesc(nguoiDungId, dangKy.getGoiMa(),
                        TrangThaiGiaoDich.THANH_CONG)
                .map(don -> {
                    long soNgayKy = don.getChuKy() == ChuKy.NAM ? 365 : 30;
                    long conLai = Math.max(0, Duration.between(now, dangKy.getHetHanAt()).toDays());
                    return Math.min(don.getSoTien(), don.getSoTien() * conLai / soNgayKy);
                })
                .orElse(0L);
    }
}
