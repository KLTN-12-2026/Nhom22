package com.do_an_tot_nghiep.k28.billing.service;

import com.do_an_tot_nghiep.k28.account.dto.NotificationContact;
import com.do_an_tot_nghiep.k28.account.dto.UserResponse;
import com.do_an_tot_nghiep.k28.account.service.AccountService;
import com.do_an_tot_nghiep.k28.admin.entity.enums.HanhDongQuanTri;
import com.do_an_tot_nghiep.k28.admin.entity.enums.LoaiDoiTuong;
import com.do_an_tot_nghiep.k28.admin.service.AuditService;
import com.do_an_tot_nghiep.k28.billing.dto.AdminStudentVerificationResponse;
import com.do_an_tot_nghiep.k28.billing.dto.StudentDecisionRequest;
import com.do_an_tot_nghiep.k28.billing.dto.StudentOfferResponse;
import com.do_an_tot_nghiep.k28.billing.dto.StudentVerificationQuery;
import com.do_an_tot_nghiep.k28.billing.dto.StudentVerificationRequest;
import com.do_an_tot_nghiep.k28.billing.entity.ChuongTrinhUuDai;
import com.do_an_tot_nghiep.k28.billing.entity.DangKyGoi;
import com.do_an_tot_nghiep.k28.billing.entity.GoiDichVu;
import com.do_an_tot_nghiep.k28.billing.entity.XacMinhHssv;
import com.do_an_tot_nghiep.k28.billing.entity.enums.MaUuDai;
import com.do_an_tot_nghiep.k28.billing.entity.enums.NguonDangKy;
import com.do_an_tot_nghiep.k28.billing.entity.enums.PhuongThucXacMinh;
import com.do_an_tot_nghiep.k28.billing.entity.enums.TrangThaiXacMinh;
import com.do_an_tot_nghiep.k28.billing.mapper.BillingMapper;
import com.do_an_tot_nghiep.k28.billing.repository.ChuongTrinhUuDaiRepository;
import com.do_an_tot_nghiep.k28.billing.repository.GoiDichVuRepository;
import com.do_an_tot_nghiep.k28.billing.repository.XacMinhHssvRepository;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.realtime.LoaiSuKien;
import com.do_an_tot_nghiep.k28.common.realtime.RealtimeService;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import com.do_an_tot_nghiep.k28.content.service.FileService;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

@Service
@RequiredArgsConstructor
public class StudentOfferService {

    static final Duration HIEU_LUC_XAC_MINH = Duration.ofDays(365);

    private final ChuongTrinhUuDaiRepository uuDai;
    private final XacMinhHssvRepository xacMinh;
    private final GoiDichVuRepository goiDichVu;
    private final EntitlementService entitlements;
    private final AccountService accounts;
    private final FileService files;
    private final AuditService audit;
    private final BillingMapper mapper;
    private final RealtimeService realtime;
    private final Clock clock;
    private final TransactionTemplate tx;

    @Transactional(readOnly = true)
    public StudentOfferResponse status(Long nguoiDungId) {
        ChuongTrinhUuDai ct = offer();
        Instant now = clock.instant();
        Optional<XacMinhHssv> ganNhat = xacMinh.findFirstByNguoiDungIdOrderByIdDesc(nguoiDungId);
        boolean coTheNhan = claimError(nguoiDungId, ct, now) == null;
        return new StudentOfferResponse(ct.isHoatDong(), ct.getGoiMa(), tenGoi(ct.getGoiMa()), ct.getPhanTramGiam(),
                ct.getSoNgay(), ct.danhSachTenMien(), ganNhat.map(mapper::toResponse).orElse(null), coTheNhan);
    }

    public StudentOfferResponse submit(Long nguoiDungId, StudentVerificationRequest request) {
        Long tepId = request.tepTheId() == null ? null : Long.valueOf(request.tepTheId());
        if (tepId != null) {
            files.ownedFile(nguoiDungId, tepId)
                    .filter(file -> "ANH".equals(file.loai()))
                    .orElseThrow(() -> new ApiException(ErrorCode.BUSINESS_RULE, "tepTheId",
                            "Chọn ảnh thẻ học sinh, sinh viên đã tải lên xong"));
        }
        tx.executeWithoutResult(status -> save(nguoiDungId, request, tepId));
        if (tepId != null) {
            realtime.toAdmins(LoaiSuKien.HANG_CHO_QUAN_TRI);
        }
        return status(nguoiDungId);
    }

    private void save(Long nguoiDungId, StudentVerificationRequest request, Long tepId) {
        ChuongTrinhUuDai ct = offer();
        if (!ct.isHoatDong()) {
            throw new ApiException(ErrorCode.BUSINESS_RULE, "Chương trình ưu đãi học sinh, sinh viên đang tạm dừng");
        }
        Instant now = clock.instant().truncatedTo(ChronoUnit.MILLIS);
        if (xacMinh.existsByNguoiDungIdAndTrangThai(nguoiDungId, TrangThaiXacMinh.CHO_DUYET)) {
            throw new ApiException(ErrorCode.CONFLICT, "Yêu cầu xác minh trước đang chờ duyệt");
        }
        if (approved(nguoiDungId, now).isPresent()) {
            throw new ApiException(ErrorCode.CONFLICT, "Bạn đã được xác minh là học sinh, sinh viên");
        }
        XacMinhHssv moi;
        if (tepId == null) {
            UserResponse me = accounts.me(nguoiDungId);
            if (me.emailXacThucAt() == null || !ct.chapNhanEmail(me.email())) {
                throw new ApiException(ErrorCode.BUSINESS_RULE, "tepTheId",
                        "Email tài khoản không thuộc tên miền trường được chấp nhận, hãy tải ảnh thẻ học sinh, sinh viên");
            }
            moi = XacMinhHssv.moi(nguoiDungId, PhuongThucXacMinh.EMAIL, null, request.tenTruong());
            moi.duyet(null, now, now.plus(HIEU_LUC_XAC_MINH));
        } else {
            moi = XacMinhHssv.moi(nguoiDungId, PhuongThucXacMinh.ANH_THE, tepId, request.tenTruong());
        }
        xacMinh.saveAndFlush(moi);
    }

    @Transactional
    public StudentOfferResponse claim(Long nguoiDungId) {
        ChuongTrinhUuDai ct = uuDai.findForUpdate(MaUuDai.HSSV).orElseThrow();
        Instant now = clock.instant().truncatedTo(ChronoUnit.MILLIS);
        String loi = claimError(nguoiDungId, ct, now);
        if (loi != null) {
            throw new ApiException(ErrorCode.BUSINESS_RULE, loi);
        }
        XacMinhHssv daDuyet = xacMinh.findForUpdate(approved(nguoiDungId, now).orElseThrow().getId()).orElseThrow();
        entitlements.grant(nguoiDungId, ct.getGoiMa(), NguonDangKy.HSSV, ct.getSoNgay(), now);
        daDuyet.nhanUuDai(now);
        xacMinh.saveAndFlush(daDuyet);
        return status(nguoiDungId);
    }

    public PageResponse<AdminStudentVerificationResponse> page(StudentVerificationQuery query) {
        var page = xacMinh.adminSearch(query.trangThai(), PageRequest.of(query.page(), query.size(),
                Sort.by(Sort.Order.desc("id"))));
        Map<Long, NotificationContact> contacts = accounts.contacts(
                page.getContent().stream().map(XacMinhHssv::getNguoiDungId).distinct().toList());
        return PageResponse.of(page.map(item -> toAdmin(item, contacts.get(item.getNguoiDungId()))));
    }

    public AdminStudentVerificationResponse decide(Long actorId, Long id, StudentDecisionRequest request) {
        XacMinhHssv item = tx.execute(status -> review(actorId, id, request));
        realtime.toUser(item.getNguoiDungId(), LoaiSuKien.GOI_THAY_DOI, null);
        realtime.toOtherAdmins(actorId, LoaiSuKien.MUC_DA_XU_LY, item.getId().toString());
        return toAdmin(item, accounts.contacts(List.of(item.getNguoiDungId())).get(item.getNguoiDungId()));
    }

    private XacMinhHssv review(Long actorId, Long id, StudentDecisionRequest request) {
        XacMinhHssv item = xacMinh.findForUpdate(id)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy yêu cầu xác minh"));
        if (!Objects.equals(item.getVersion(), request.version())) {
            throw new ApiException(ErrorCode.VERSION_CONFLICT, "Yêu cầu đã được xử lý ở nơi khác, vui lòng tải lại");
        }
        if (item.getTrangThai() != TrangThaiXacMinh.CHO_DUYET) {
            throw new ApiException(ErrorCode.BUSINESS_RULE, "Yêu cầu này đã được xử lý");
        }
        Instant now = clock.instant().truncatedTo(ChronoUnit.MILLIS);
        if (request.duyet()) {
            item.duyet(actorId, now, now.plus(HIEU_LUC_XAC_MINH));
        } else {
            item.tuChoi(actorId, now, request.lyDo());
        }
        xacMinh.saveAndFlush(item);
        NotificationContact contact = accounts.contacts(List.of(item.getNguoiDungId())).get(item.getNguoiDungId());
        audit.record(actorId, request.duyet() ? HanhDongQuanTri.DUYET_HSSV : HanhDongQuanTri.TU_CHOI_HSSV,
                LoaiDoiTuong.XAC_MINH_HSSV, item.getId(),
                contact == null ? item.getNguoiDungId().toString() : contact.email(), request.lyDo(),
                Map.of("trangThai", TrangThaiXacMinh.CHO_DUYET.name()), Map.of("trangThai", item.getTrangThai().name()));
        return item;
    }

    private String claimError(Long nguoiDungId, ChuongTrinhUuDai ct, Instant now) {
        if (!ct.isHoatDong()) {
            return "Chương trình ưu đãi học sinh, sinh viên đang tạm dừng";
        }
        if (!ct.mienPhi()) {
            return "Ưu đãi hiện là giảm " + ct.getPhanTramGiam() + "% khi mua gói " + tenGoi(ct.getGoiMa())
                    + ", được trừ tự động lúc thanh toán";
        }
        if (approved(nguoiDungId, now).isEmpty()) {
            return "Bạn cần được xác minh là học sinh, sinh viên trước khi nhận ưu đãi";
        }
        if (xacMinh.existsByNguoiDungIdAndDaNhanUuDaiAtIsNotNull(nguoiDungId)) {
            return "Mỗi tài khoản chỉ nhận ưu đãi học sinh, sinh viên một lần";
        }
        if (ct.getSoSuatToiDa() != null && xacMinh.countByDaNhanUuDaiAtIsNotNull() >= ct.getSoSuatToiDa()) {
            return "Ưu đãi học sinh, sinh viên đã hết suất";
        }
        Optional<DangKyGoi> hienTai = entitlements.current(nguoiDungId).filter(DangKyGoi::traPhi);
        if (hienTai.isPresent()) {
            return "Bạn đang dùng gói trả phí " + tenGoi(hienTai.get().getGoiMa())
                    + ", hãy nhận ưu đãi sau khi gói hiện tại hết hạn";
        }
        return null;
    }

    private Optional<XacMinhHssv> approved(Long nguoiDungId, Instant now) {
        return xacMinh.findFirstByNguoiDungIdAndTrangThaiOrderByIdDesc(nguoiDungId, TrangThaiXacMinh.DA_DUYET)
                .filter(item -> item.conHieuLuc(now));
    }

    private ChuongTrinhUuDai offer() {
        return uuDai.findByMa(MaUuDai.HSSV).orElseThrow();
    }

    private String tenGoi(String goiMa) {
        return goiDichVu.findByMa(goiMa).map(GoiDichVu::getTen).orElse(goiMa);
    }

    private AdminStudentVerificationResponse toAdmin(XacMinhHssv item, NotificationContact contact) {
        String anhTheUrl = null;
        if (item.getTepTheId() != null) {
            try {
                anhTheUrl = files.linkedFile(item.getTepTheId()).downloadUrl();
            } catch (ApiException e) {
                anhTheUrl = null;
            }
        }
        return new AdminStudentVerificationResponse(item.getId().toString(), item.getNguoiDungId().toString(),
                contact == null ? null : contact.email(), contact == null ? null : contact.tenHienThi(),
                item.getPhuongThuc(), item.getTenTruong(), item.getTrangThai(), item.getLyDoTuChoi(), anhTheUrl,
                item.getDuyetAt(), item.getHetHanAt(), item.getDaNhanUuDaiAt(), item.getCreatedAt(), item.getVersion());
    }
}
