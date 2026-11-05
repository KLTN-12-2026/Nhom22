package com.do_an_tot_nghiep.k28.admin.service;

import com.do_an_tot_nghiep.k28.account.service.AccountService;
import com.do_an_tot_nghiep.k28.admin.dto.AuditLogQuery;
import com.do_an_tot_nghiep.k28.admin.dto.AuditLogResponse;
import com.do_an_tot_nghiep.k28.admin.entity.NhatKyQuanTri;
import com.do_an_tot_nghiep.k28.admin.entity.enums.HanhDongQuanTri;
import com.do_an_tot_nghiep.k28.admin.entity.enums.LoaiDoiTuong;
import com.do_an_tot_nghiep.k28.admin.repository.NhatKyQuanTriRepository;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@Service
@RequiredArgsConstructor
public class AuditService {

    private static final int SO_NGAY_TOI_DA = 366;

    private final NhatKyQuanTriRepository logs;
    private final AccountService accounts;
    private final JsonMapper json;
    private final Clock clock;

    @Transactional(propagation = Propagation.MANDATORY)
    public void record(Long actorId, HanhDongQuanTri hanhDong, LoaiDoiTuong loai, Long doiTuongId,
                       String tenDoiTuong, String lyDo, Map<String, ?> truoc, Map<String, ?> sau) {
        logs.save(NhatKyQuanTri.builder()
                .nguoiThucHienId(actorId)
                .hanhDong(hanhDong)
                .loaiDoiTuong(loai)
                .doiTuongId(doiTuongId)
                .tenDoiTuong(tenDoiTuong)
                .lyDo(lyDo)
                .truocJson(truoc == null ? null : json.writeValueAsString(truoc))
                .sauJson(sau == null ? null : json.writeValueAsString(sau))
                .createdAt(clock.instant())
                .build());
    }

    @Transactional(readOnly = true)
    public PageResponse<AuditLogResponse> page(Long adminId, AuditLogQuery query) {
        ZoneId zone = accounts.zoneOf(adminId);
        LocalDate tuNgay = parseDate(query.tuNgay(), "tuNgay");
        LocalDate denNgay = parseDate(query.denNgay(), "denNgay");
        if (tuNgay != null && denNgay != null) {
            if (tuNgay.isAfter(denNgay)) {
                throw new ApiException(ErrorCode.VALIDATION_FAILED, "denNgay", "Ngày kết thúc phải từ ngày bắt đầu trở đi");
            }
            if (ChronoUnit.DAYS.between(tuNgay, denNgay) >= SO_NGAY_TOI_DA) {
                throw new ApiException(ErrorCode.VALIDATION_FAILED, "tuNgay", "Chọn khoảng tối đa 366 ngày");
            }
        }
        Instant tu = tuNgay == null ? null : tuNgay.atStartOfDay(zone).toInstant();
        Instant den = denNgay == null ? null : denNgay.plusDays(1).atStartOfDay(zone).toInstant();
        Page<NhatKyQuanTri> result = logs.search(query.hanhDong(), query.loai(), tu, den, likePattern(query.q()),
                PageRequest.of(query.page(), query.size()));
        Map<Long, String> names = accounts.publicDisplayNames(
                result.getContent().stream().map(NhatKyQuanTri::getNguoiThucHienId).distinct().toList());
        return PageResponse.of(result.map(log -> new AuditLogResponse(
                String.valueOf(log.getId()),
                new AuditLogResponse.NguoiThucHien(String.valueOf(log.getNguoiThucHienId()),
                        names.get(log.getNguoiThucHienId())),
                log.getHanhDong(),
                new AuditLogResponse.DoiTuong(log.getLoaiDoiTuong(), String.valueOf(log.getDoiTuongId()),
                        log.getTenDoiTuong()),
                log.getLyDo(),
                readJson(log.getTruocJson()),
                readJson(log.getSauJson()),
                log.getCreatedAt()
        )));
    }

    private JsonNode readJson(String value) {
        return value == null ? null : json.readTree(value);
    }

    private static LocalDate parseDate(String value, String field) {
        if (value == null) {
            return null;
        }
        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException ex) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, field, "Ngày không hợp lệ");
        }
    }

    private static String likePattern(String q) {
        if (q == null) {
            return null;
        }
        return "%" + q.replace("!", "!!").replace("%", "!%").replace("_", "!_") + "%";
    }
}
