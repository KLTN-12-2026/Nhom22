package com.do_an_tot_nghiep.k28.moderation.service;

import com.do_an_tot_nghiep.k28.common.realtime.LoaiSuKien;
import com.do_an_tot_nghiep.k28.common.realtime.RealtimeService;
import com.do_an_tot_nghiep.k28.account.service.AccountService;
import com.do_an_tot_nghiep.k28.admin.entity.enums.HanhDongQuanTri;
import com.do_an_tot_nghiep.k28.admin.entity.enums.LoaiDoiTuong;
import com.do_an_tot_nghiep.k28.admin.service.AuditService;
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

    @Transactional(readOnly = true)
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
        return PageResponse.of(result.map(report -> toResponse(report, names)));
    }

    @Transactional
    public AdminReportResponse resolve(Long adminId, Long id, ResolveReportRequest request) {
        BaoCaoNoiDung report = reports.findForUpdate(id)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy báo cáo"));
        if (!report.isPending()) {
            throw new ApiException(ErrorCode.CONFLICT, "Báo cáo đã được xử lý");
        }
        boolean hide = request.quyetDinh() == QuyetDinhBaoCao.AN;
        Boolean anTruoc = switch (report.getLoaiDoiTuong()) {
            case BO_THE -> content.moderateDeck(report.getDoiTuongId(), hide);
            case THE_TU_VUNG -> content.moderateCard(report.getDoiTuongId(), hide);
            case YEU_CAU_AI -> ai.moderate(report.getDoiTuongId(), hide);
        };
        String lyDo = request.lyDo().strip();
        Instant now = clock.instant();
        List<BaoCaoNoiDung> pending = reports.findPendingForUpdate(report.getLoaiDoiTuong(), report.getDoiTuongId());
        pending.forEach(item -> item.resolve(request.quyetDinh(), adminId, lyDo, now));
        reports.flush();
        realtime.toAdmins(LoaiSuKien.HANG_CHO_QUAN_TRI);

        Map<String, Object> truoc = new LinkedHashMap<>();
        truoc.put("trangThai", TrangThaiBaoCao.CHO_XU_LY);
        truoc.put("anKiemDuyet", anTruoc);
        Map<String, Object> sau = new LinkedHashMap<>();
        sau.put("trangThai", report.getTrangThai());
        sau.put("anKiemDuyet", anTruoc == null ? null : anTruoc || hide);
        sau.put("baoCaoIds", pending.stream().map(item -> String.valueOf(item.getId())).toList());
        audit.record(adminId, hide ? HanhDongQuanTri.AN_NOI_DUNG : HanhDongQuanTri.GIU_NOI_DUNG,
                LoaiDoiTuong.valueOf(report.getLoaiDoiTuong().name()), report.getDoiTuongId(),
                tenDoiTuong(report), lyDo, truoc, sau);

        Map<Long, String> names = accounts.publicDisplayNames(List.of(report.getNguoiBaoCaoId(), adminId));
        return toResponse(report, names);
    }

    private String tenDoiTuong(BaoCaoNoiDung report) {
        JsonNode ten = json.readTree(report.getNoiDungJson()).get("ten");
        return ten == null || ten.isNull() ? report.getLoaiDoiTuong() + " #" + report.getDoiTuongId() : ten.asString();
    }

    private AdminReportResponse toResponse(BaoCaoNoiDung report, Map<Long, String> names) {
        Long xuLyId = report.getNguoiXuLyId();
        return new AdminReportResponse(
                String.valueOf(report.getId()),
                report.getLoaiDoiTuong(),
                String.valueOf(report.getDoiTuongId()),
                report.getLyDo(),
                report.getMoTa(),
                json.readTree(report.getNoiDungJson()),
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
