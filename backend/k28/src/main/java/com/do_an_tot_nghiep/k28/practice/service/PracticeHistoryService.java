package com.do_an_tot_nghiep.k28.practice.service;

import com.do_an_tot_nghiep.k28.account.service.AccountService;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import com.do_an_tot_nghiep.k28.learning.repository.StudyTimeRow;
import com.do_an_tot_nghiep.k28.practice.dto.PracticeHistoryQuery;
import com.do_an_tot_nghiep.k28.practice.dto.PracticeHistoryResponse;
import com.do_an_tot_nghiep.k28.practice.repository.LanLamBaiRepository;
import com.do_an_tot_nghiep.k28.practice.repository.PracticeHistoryRow;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PracticeHistoryService {

    private final LanLamBaiRepository attempts;
    private final AccountService accountService;

    @Transactional(readOnly = true)
    public PageResponse<PracticeHistoryResponse> list(Long userId, PracticeHistoryQuery query) {
        LocalDate tuNgay = parseDate(query.tuNgay(), "tuNgay");
        LocalDate denNgay = parseDate(query.denNgay(), "denNgay");
        if (tuNgay != null && denNgay != null && tuNgay.isAfter(denNgay)) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "denNgay", "Ngày kết thúc phải từ ngày bắt đầu trở đi");
        }
        ZoneId zone = accountService.zoneOf(userId);
        Instant batDau = tuNgay == null ? null : tuNgay.atStartOfDay(zone).toInstant();
        Instant ketThuc = denNgay == null ? null : denNgay.plusDays(1).atStartOfDay(zone).toInstant();
        return PageResponse.of(attempts.history(
                userId,
                query.type(),
                batDau,
                ketThuc,
                PageRequest.of(query.page(), query.size())
        ).map(this::toResponse));
    }

    @Transactional(readOnly = true)
    public List<StudyTimeRow> studyTimes(Long userId, Instant batDau, Instant ketThuc) {
        return attempts.studyTimes(userId, batDau, ketThuc);
    }

    private PracticeHistoryResponse toResponse(PracticeHistoryRow row) {
        return new PracticeHistoryResponse(
                String.valueOf(row.lanLamId()),
                String.valueOf(row.baiLuyenId()),
                row.loaiBai(),
                PracticeResults.deckLabel(row.boTheTen(), row.nguon()),
                row.soCauDung(),
                row.tongSoCau(),
                row.tongSoCau() - row.soCauDung(),
                row.diem(),
                row.thoiGian(),
                row.nopAt(),
                row.laLuyenLai());
    }

    private LocalDate parseDate(String value, String field) {
        if (value == null) {
            return null;
        }
        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException exception) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, field, "Ngày không tồn tại");
        }
    }
}
