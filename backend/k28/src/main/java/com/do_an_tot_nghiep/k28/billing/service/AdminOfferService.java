package com.do_an_tot_nghiep.k28.billing.service;

import com.do_an_tot_nghiep.k28.admin.entity.enums.HanhDongQuanTri;
import com.do_an_tot_nghiep.k28.admin.entity.enums.LoaiDoiTuong;
import com.do_an_tot_nghiep.k28.admin.service.AuditService;
import com.do_an_tot_nghiep.k28.billing.dto.OfferResponse;
import com.do_an_tot_nghiep.k28.billing.dto.PromotionQuery;
import com.do_an_tot_nghiep.k28.billing.dto.PromotionRequest;
import com.do_an_tot_nghiep.k28.billing.dto.PromotionResponse;
import com.do_an_tot_nghiep.k28.billing.dto.UpdateOfferRequest;
import com.do_an_tot_nghiep.k28.billing.entity.ChuongTrinhUuDai;
import com.do_an_tot_nghiep.k28.billing.entity.GoiDichVu;
import com.do_an_tot_nghiep.k28.billing.entity.KhuyenMai;
import com.do_an_tot_nghiep.k28.billing.entity.enums.LoaiGiam;
import com.do_an_tot_nghiep.k28.billing.entity.enums.MaUuDai;
import com.do_an_tot_nghiep.k28.billing.entity.enums.TrangThaiGiaoDich;
import com.do_an_tot_nghiep.k28.billing.mapper.BillingMapper;
import com.do_an_tot_nghiep.k28.billing.repository.ChuongTrinhUuDaiRepository;
import com.do_an_tot_nghiep.k28.billing.repository.GiaoDichThanhToanRepository;
import com.do_an_tot_nghiep.k28.billing.repository.GoiDichVuRepository;
import com.do_an_tot_nghiep.k28.billing.repository.KhuyenMaiRepository;
import com.do_an_tot_nghiep.k28.billing.repository.XacMinhHssvRepository;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminOfferService {

    private final KhuyenMaiRepository khuyenMai;
    private final ChuongTrinhUuDaiRepository uuDai;
    private final GoiDichVuRepository goiDichVu;
    private final GiaoDichThanhToanRepository giaoDich;
    private final XacMinhHssvRepository xacMinh;
    private final AuditService audit;
    private final BillingMapper mapper;

    @Transactional(readOnly = true)
    public PageResponse<PromotionResponse> promotions(PromotionQuery query) {
        return PageResponse.of(khuyenMai.adminSearch(query.hoatDong(), PageRequest.of(query.page(), query.size(),
                        Sort.by(Sort.Order.desc("batDauAt"), Sort.Order.desc("id"))))
                .map(this::toResponse));
    }

    @Transactional
    public PromotionResponse createPromotion(Long actorId, PromotionRequest request) {
        validate(request);
        if (request.ma() != null && khuyenMai.existsByMa(request.ma())) {
            throw new ApiException(ErrorCode.CONFLICT, "ma", "Mã khuyến mãi đã tồn tại");
        }
        KhuyenMai moi;
        try {
            moi = khuyenMai.saveAndFlush(build(request));
        } catch (DataIntegrityViolationException e) {
            throw new ApiException(ErrorCode.CONFLICT, "ma", "Mã khuyến mãi đã tồn tại");
        }
        audit.record(actorId, HanhDongQuanTri.TAO_KHUYEN_MAI, LoaiDoiTuong.KHUYEN_MAI, moi.getId(), label(moi),
                request.lyDo(), null, fields(moi));
        return toResponse(moi);
    }

    @Transactional
    public PromotionResponse updatePromotion(Long actorId, Long id, PromotionRequest request) {
        KhuyenMai km = khuyenMai.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy khuyến mãi"));
        if (request.version() == null || !Objects.equals(km.getVersion(), request.version())) {
            throw new ApiException(ErrorCode.VERSION_CONFLICT, "Khuyến mãi đã được sửa ở nơi khác, vui lòng tải lại");
        }
        validate(request);
        if (request.ma() != null && khuyenMai.existsByMaAndIdNot(request.ma(), id)) {
            throw new ApiException(ErrorCode.CONFLICT, "ma", "Mã khuyến mãi đã tồn tại");
        }
        Map<String, Object> truoc = fields(km);
        km.capNhat(build(request));
        Map<String, Object> sau = fields(km);
        truoc.keySet().removeIf(key -> Objects.equals(truoc.get(key), sau.get(key)));
        sau.keySet().retainAll(truoc.keySet());
        if (!truoc.isEmpty()) {
            khuyenMai.saveAndFlush(km);
            audit.record(actorId, HanhDongQuanTri.SUA_KHUYEN_MAI, LoaiDoiTuong.KHUYEN_MAI, km.getId(), label(km),
                    request.lyDo(), truoc, sau);
        }
        return toResponse(km);
    }

    @Transactional(readOnly = true)
    public List<OfferResponse> offers() {
        return uuDai.findAllByOrderByIdAsc().stream().map(this::toResponse).toList();
    }

    @Transactional
    public OfferResponse updateOffer(Long actorId, MaUuDai ma, UpdateOfferRequest request) {
        ChuongTrinhUuDai ct = uuDai.findForUpdate(ma)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy chương trình ưu đãi"));
        if (!Objects.equals(ct.getVersion(), request.version())) {
            throw new ApiException(ErrorCode.VERSION_CONFLICT, "Ưu đãi đã được sửa ở nơi khác, vui lòng tải lại");
        }
        paidPlan(request.goiMa(), "goiMa");
        int phanTram = ma == MaUuDai.DUNG_THU ? 100 : request.phanTramGiam();
        String tenMien = ma == MaUuDai.DUNG_THU || request.tenMien() == null ? null
                : String.join(",", request.tenMien().stream()
                .map(item -> item.strip().toLowerCase(Locale.ROOT).replaceFirst("^@", ""))
                .filter(item -> !item.isEmpty())
                .distinct()
                .toList());
        if (tenMien != null && tenMien.length() > 1000) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "tenMien", "Danh sách tên miền quá dài");
        }
        Map<String, Object> truoc = fields(ct);
        ct.capNhat(request.goiMa(), phanTram, request.soNgay(),
                ma == MaUuDai.DUNG_THU ? null : request.soSuatToiDa(), tenMien == null || tenMien.isEmpty() ? null : tenMien,
                request.hoatDong());
        Map<String, Object> sau = fields(ct);
        truoc.keySet().removeIf(key -> Objects.equals(truoc.get(key), sau.get(key)));
        sau.keySet().retainAll(truoc.keySet());
        if (!truoc.isEmpty()) {
            uuDai.saveAndFlush(ct);
            audit.record(actorId, HanhDongQuanTri.SUA_UU_DAI, LoaiDoiTuong.CHUONG_TRINH_UU_DAI, ct.getId(),
                    ct.getMa().name(), request.lyDo(), truoc, sau);
        }
        return toResponse(ct);
    }

    private void validate(PromotionRequest request) {
        if (!request.ketThucAt().isAfter(request.batDauAt())) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "ketThucAt", "Thời điểm kết thúc phải sau thời điểm bắt đầu");
        }
        if (request.loaiGiam() == LoaiGiam.PHAN_TRAM && request.giaTri() > 100) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "giaTri", "Giảm theo phần trăm tối đa 100%");
        }
        if (request.goiMa() != null) {
            paidPlan(request.goiMa(), "goiMa");
        }
    }

    private GoiDichVu paidPlan(String goiMa, String field) {
        return goiDichVu.findByMa(goiMa)
                .filter(goi -> goi.getGiaThang() > 0)
                .orElseThrow(() -> new ApiException(ErrorCode.BUSINESS_RULE, field, "Chọn một gói trả phí"));
    }

    private KhuyenMai build(PromotionRequest request) {
        return KhuyenMai.builder()
                .ma(request.ma())
                .ten(request.ten())
                .loaiGiam(request.loaiGiam())
                .giaTri(request.giaTri())
                .goiMa(request.goiMa())
                .chuKy(request.chuKy())
                .batDauAt(request.batDauAt().truncatedTo(ChronoUnit.MILLIS))
                .ketThucAt(request.ketThucAt().truncatedTo(ChronoUnit.MILLIS))
                .tongLuot(request.tongLuot())
                .luotMoiNguoi(request.luotMoiNguoi())
                .chiLanDau(request.chiLanDau())
                .hoatDong(request.hoatDong())
                .build();
    }

    private PromotionResponse toResponse(KhuyenMai km) {
        return mapper.toResponse(km, giaoDich.countByKhuyenMaiIdAndTrangThai(km.getId(), TrangThaiGiaoDich.THANH_CONG));
    }

    private OfferResponse toResponse(ChuongTrinhUuDai ct) {
        String tenGoi = goiDichVu.findByMa(ct.getGoiMa()).map(GoiDichVu::getTen).orElse(ct.getGoiMa());
        long daDung = ct.getMa() == MaUuDai.HSSV ? xacMinh.countByDaNhanUuDaiAtIsNotNull() : 0;
        return new OfferResponse(ct.getMa(), ct.getGoiMa(), tenGoi, ct.getPhanTramGiam(), ct.getSoNgay(),
                ct.getSoSuatToiDa(), ct.danhSachTenMien(), ct.isHoatDong(), daDung, ct.getVersion());
    }

    private static String label(KhuyenMai km) {
        return km.getMa() == null ? km.getTen() : km.getMa() + " — " + km.getTen();
    }

    private static Map<String, Object> fields(KhuyenMai km) {
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("ma", km.getMa());
        fields.put("ten", km.getTen());
        fields.put("loaiGiam", km.getLoaiGiam().name());
        fields.put("giaTri", km.getGiaTri());
        fields.put("goiMa", km.getGoiMa());
        fields.put("chuKy", km.getChuKy() == null ? null : km.getChuKy().name());
        fields.put("batDauAt", km.getBatDauAt().toString());
        fields.put("ketThucAt", km.getKetThucAt().toString());
        fields.put("tongLuot", km.getTongLuot());
        fields.put("luotMoiNguoi", km.getLuotMoiNguoi());
        fields.put("chiLanDau", km.isChiLanDau());
        fields.put("hoatDong", km.isHoatDong());
        return fields;
    }

    private static Map<String, Object> fields(ChuongTrinhUuDai ct) {
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("goiMa", ct.getGoiMa());
        fields.put("phanTramGiam", ct.getPhanTramGiam());
        fields.put("soNgay", ct.getSoNgay());
        fields.put("soSuatToiDa", ct.getSoSuatToiDa());
        fields.put("tenMien", ct.getTenMien());
        fields.put("hoatDong", ct.isHoatDong());
        return fields;
    }
}
