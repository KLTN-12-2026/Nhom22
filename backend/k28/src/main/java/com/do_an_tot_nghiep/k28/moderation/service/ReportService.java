package com.do_an_tot_nghiep.k28.moderation.service;

import com.do_an_tot_nghiep.k28.common.realtime.LoaiSuKien;
import com.do_an_tot_nghiep.k28.common.realtime.RealtimeService;
import com.do_an_tot_nghiep.k28.ai.service.AiModerationService;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.security.RateLimiter;
import com.do_an_tot_nghiep.k28.content.service.ContentModerationService;
import com.do_an_tot_nghiep.k28.moderation.dto.CreateReportRequest;
import com.do_an_tot_nghiep.k28.moderation.dto.ReportResponse;
import com.do_an_tot_nghiep.k28.moderation.entity.BaoCaoNoiDung;
import com.do_an_tot_nghiep.k28.moderation.entity.enums.TrangThaiBaoCao;
import com.do_an_tot_nghiep.k28.moderation.mapper.ReportMapper;
import com.do_an_tot_nghiep.k28.moderation.repository.BaoCaoNoiDungRepository;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final BaoCaoNoiDungRepository reports;
    private final ContentModerationService content;
    private final AiModerationService ai;
    private final RateLimiter rateLimiter;
    private final ReportMapper mapper;
    private final JsonMapper json;
    private final RealtimeService realtime;

    @Transactional
    public ReportResponse create(Long userId, CreateReportRequest request) {
        Map<String, Object> snapshot = switch (request.loaiDoiTuong()) {
            case BO_THE -> content.deckSnapshot(userId, request.doiTuongId());
            case THE_TU_VUNG -> content.cardSnapshot(userId, request.doiTuongId());
            case YEU_CAU_AI -> ai.reportSnapshot(userId, request.doiTuongId());
        };
        if (reports.existsByNguoiBaoCaoIdAndLoaiDoiTuongAndDoiTuongIdAndTrangThai(
                userId, request.loaiDoiTuong(), request.doiTuongId(), TrangThaiBaoCao.CHO_XU_LY)) {
            throw duplicate();
        }
        rateLimiter.check(RateLimiter.Policy.REPORT, String.valueOf(userId));
        try {
            BaoCaoNoiDung saved = reports.saveAndFlush(BaoCaoNoiDung.builder()
                    .nguoiBaoCaoId(userId)
                    .loaiDoiTuong(request.loaiDoiTuong())
                    .doiTuongId(request.doiTuongId())
                    .lyDo(request.lyDo())
                    .moTa(request.moTa().strip())
                    .noiDungJson(json.writeValueAsString(snapshot))
                    .build());
            realtime.toAdmins(LoaiSuKien.HANG_CHO_QUAN_TRI);
            return mapper.toResponse(saved);
        } catch (DataIntegrityViolationException ex) {
            throw duplicate();
        }
    }

    private static ApiException duplicate() {
        return new ApiException(ErrorCode.CONFLICT, "Bạn đã báo cáo nội dung này và báo cáo đang chờ xử lý");
    }
}
