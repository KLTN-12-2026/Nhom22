package com.do_an_tot_nghiep.k28.moderation.service;

import com.do_an_tot_nghiep.k28.common.realtime.LoaiSuKien;
import com.do_an_tot_nghiep.k28.common.realtime.RealtimeService;
import com.do_an_tot_nghiep.k28.account.service.AccountService;
import com.do_an_tot_nghiep.k28.admin.entity.enums.HanhDongQuanTri;
import com.do_an_tot_nghiep.k28.admin.entity.enums.LoaiDoiTuong;
import com.do_an_tot_nghiep.k28.admin.service.AuditService;
import com.do_an_tot_nghiep.k28.admin.service.AdminUserService;
import com.do_an_tot_nghiep.k28.account.dto.UserAdminView;
import com.do_an_tot_nghiep.k28.content.dto.FileResponse;
import com.do_an_tot_nghiep.k28.content.service.FileService;
import com.do_an_tot_nghiep.k28.notification.entity.enums.LoaiThongBao;
import com.do_an_tot_nghiep.k28.notification.service.NotificationService;
import com.do_an_tot_nghiep.k28.ai.service.AiModerationService;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import com.do_an_tot_nghiep.k28.content.service.ContentModerationService;
import com.do_an_tot_nghiep.k28.moderation.dto.AdminReportResponse;
import com.do_an_tot_nghiep.k28.moderation.dto.ResolveReportRequest;
import com.do_an_tot_nghiep.k28.moderation.entity.BaoCaoNoiDung;
import com.do_an_tot_nghiep.k28.moderation.entity.enums.LoaiDoiTuongBaoCao;
import com.do_an_tot_nghiep.k28.moderation.entity.enums.QuyetDinhBaoCao;
import com.do_an_tot_nghiep.k28.moderation.entity.enums.TrangThaiBaoCao;
import com.do_an_tot_nghiep.k28.moderation.repository.BaoCaoNoiDungRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@Service
@RequiredArgsConstructor
public class AdminReportService {

    private final BaoCaoNoiDungRepository reports;
    private final ContentModerationService content;
    private final AiModerationService ai;
    private final AuditService audit;
    private final AccountService accounts;
    private final JsonMapper json;
    private final Clock clock;
    private final RealtimeService realtime;
    private final AdminUserService admins;
    private final NotificationService notifications;
    private final FileService files;

    public PageResponse<AdminReportResponse> list(TrangThaiBaoCao trangThai, LoaiDoiTuongBaoCao loai,
                                                  int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "page phải không âm, size từ 1 đến 100");
        }
        Sort.Direction direction = trangThai == TrangThaiBaoCao.CHO_XU_LY ? Sort.Direction.ASC : Sort.Direction.DESC;
        Page<BaoCaoNoiDung> result = reports.search(trangThai, loai,
                PageRequest.of(page, size, Sort.by(direction, "createdAt", "id")));
        Map<Long, String> names = accounts.publicDisplayNames(result.getContent().stream()
                .flatMap(report -> Stream.of(report.getNguoiBaoCaoId(), report.getNguoiXuLyId()))
                .filter(Objects::nonNull)
                .distinct()
                .toList());
        return PageResponse.of(result.map(report -> toResponse(report, names, reportedAvatarUrl(report))));
    }

    @Transactional
    public AdminReportResponse resolve(Long adminId, Long id, ResolveReportRequest request) {
        BaoCaoNoiDung report = reports.findForUpdate(id)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy báo cáo"));
        if (!report.isPending()) {
            throw new ApiException(ErrorCode.CONFLICT, "Báo cáo đã được xử lý");
        }
        QuyetDinhBaoCao quyetDinh = request.quyetDinh();
        boolean userReport = report.getLoaiDoiTuong() == LoaiDoiTuongBaoCao.NGUOI_DUNG;
        if (quyetDinh == QuyetDinhBaoCao.KHOA && !userReport) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "quyetDinh",
                    "Chỉ báo cáo người dùng mới có quyết định khóa tài khoản");
        }
        String lyDo = request.lyDo().strip();
        Map<String, Object> truoc = new LinkedHashMap<>();
        truoc.put("trangThai", TrangThaiBaoCao.CHO_XU_LY);
        Map<String, Object> sau = new LinkedHashMap<>();
        HanhDongQuanTri hanhDong;
        if (userReport) {
            Long targetId = report.getDoiTuongId();
            hanhDong = switch (quyetDinh) {
                case GIU -> HanhDongQuanTri.GIU_NOI_DUNG;
                case AN -> {
                    UserAdminView after = admins.hideAvatarFromReport(targetId, reportedAvatarId(report), lyDo);
                    sau.put("anhDaiDienAnId", after.anhDaiDienId());
                    yield HanhDongQuanTri.AN_ANH_DAI_DIEN;
                }
                case KHOA -> {
                    sau.put("khoaMoi", admins.lockFromReport(adminId, targetId, lyDo));
                    yield HanhDongQuanTri.KHOA_TAI_KHOAN;
                }
            };
        } else {
            boolean hide = quyetDinh == QuyetDinhBaoCao.AN;
            Boolean anTruoc = switch (report.getLoaiDoiTuong()) {
                case BO_THE -> content.moderateDeck(report.getDoiTuongId(), hide);
                case THE_TU_VUNG -> content.moderateCard(report.getDoiTuongId(), hide);
                case YEU_CAU_AI -> ai.moderate(report.getDoiTuongId(), hide);
                case NGUOI_DUNG -> throw new IllegalStateException();
            };
            truoc.put("anKiemDuyet", anTruoc);
            sau.put("anKiemDuyet", anTruoc == null ? null : anTruoc || hide);
            hanhDong = hide ? HanhDongQuanTri.AN_NOI_DUNG : HanhDongQuanTri.GIU_NOI_DUNG;
        }
        Instant now = clock.instant();
        List<BaoCaoNoiDung> pending = reports.findPendingForUpdate(report.getLoaiDoiTuong(), report.getDoiTuongId());
        pending.forEach(item -> item.resolve(quyetDinh, adminId, lyDo, now));
        reports.flush();
        realtime.toAdmins(LoaiSuKien.HANG_CHO_QUAN_TRI);
        pending.forEach(item -> realtime.toOtherAdmins(adminId, LoaiSuKien.MUC_DA_XU_LY, "BAO_CAO:" + item.getId()));
        String ten = tenDoiTuong(report);
        pending.stream().map(BaoCaoNoiDung::getNguoiBaoCaoId).distinct().forEach(reporterId ->
                notifications.create(reporterId, LoaiThongBao.KET_QUA_BAO_CAO, null,
                        "Báo cáo của bạn đã được xử lý", resultText(report.getLoaiDoiTuong(), quyetDinh, ten),
                        null, true, false));

        sau.put("trangThai", report.getTrangThai());
        sau.put("baoCaoIds", pending.stream().map(item -> String.valueOf(item.getId())).toList());
        audit.record(adminId, hanhDong, LoaiDoiTuong.valueOf(report.getLoaiDoiTuong().name()),
                report.getDoiTuongId(), ten, lyDo, truoc, sau);

        Map<Long, String> names = accounts.publicDisplayNames(List.of(report.getNguoiBaoCaoId(), adminId));
        return toResponse(report, names, null);
    }

    private static String resultText(LoaiDoiTuongBaoCao loai, QuyetDinhBaoCao quyetDinh, String ten) {
        String doiTuong = switch (loai) {
            case BO_THE -> "bộ thẻ";
            case THE_TU_VUNG -> "thẻ";
            case YEU_CAU_AI -> "kết quả AI";
            case NGUOI_DUNG -> "người dùng";
        };
        String ketQua = switch (quyetDinh) {
            case GIU -> "Quản trị viên đã xem xét và quyết định giữ nguyên.";
            case AN -> loai == LoaiDoiTuongBaoCao.NGUOI_DUNG
                    ? "Ảnh đại diện của người dùng này đã bị ẩn."
                    : "Nội dung đã bị ẩn khỏi mọi người.";
            case KHOA -> "Tài khoản người dùng này đã bị khóa.";
        };
        return "Cảm ơn bạn đã báo cáo " + doiTuong + " \"" + ten + "\". " + ketQua;
    }

    private Long reportedAvatarId(BaoCaoNoiDung report) {
        JsonNode avatar = json.readTree(report.getNoiDungJson()).get("anhDaiDienId");
        return avatar == null || avatar.isNull() ? null : Long.valueOf(avatar.asString());
    }

    private String reportedAvatarUrl(BaoCaoNoiDung report) {
        if (report.getLoaiDoiTuong() != LoaiDoiTuongBaoCao.NGUOI_DUNG) {
            return null;
        }
        Long fileId = reportedAvatarId(report);
        FileResponse file = fileId == null ? null : files.reportedAvatar(report.getDoiTuongId(), fileId);
        return file == null ? null : file.downloadUrl();
    }

    private String tenDoiTuong(BaoCaoNoiDung report) {
        JsonNode ten = json.readTree(report.getNoiDungJson()).get("ten");
        return ten == null || ten.isNull() ? report.getLoaiDoiTuong() + " #" + report.getDoiTuongId() : ten.asString();
    }

    private AdminReportResponse toResponse(BaoCaoNoiDung report, Map<Long, String> names, String anhDaiDienUrl) {
        Long xuLyId = report.getNguoiXuLyId();
        return new AdminReportResponse(
                String.valueOf(report.getId()),
                report.getLoaiDoiTuong(),
                String.valueOf(report.getDoiTuongId()),
                report.getLyDo(),
                report.getMoTa(),
                json.readTree(report.getNoiDungJson()),
                anhDaiDienUrl,
                report.getTrangThai(),
                new AdminReportResponse.NguoiDung(String.valueOf(report.getNguoiBaoCaoId()),
                        names.get(report.getNguoiBaoCaoId())),
                xuLyId == null ? null : new AdminReportResponse.NguoiDung(String.valueOf(xuLyId), names.get(xuLyId)),
                report.getLyDoXuLy(),
                report.getXuLyAt(),
                report.getCreatedAt()
        );
    }
}
