package com.do_an_tot_nghiep.k28.learning.service;

import com.do_an_tot_nghiep.k28.account.service.AccountService;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import com.do_an_tot_nghiep.k28.learning.dto.HistoryQuery;
import com.do_an_tot_nghiep.k28.learning.dto.LichSuOnResponse;
import com.do_an_tot_nghiep.k28.learning.dto.TienDoResponse;
import com.do_an_tot_nghiep.k28.learning.repository.HistoryRow;
import com.do_an_tot_nghiep.k28.learning.repository.LichSuOnRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

@Service
@RequiredArgsConstructor
public class HistoryService {

    private final AccountService accountService;
    private final LichSuOnRepository history;
    private final JsonMapper jsonMapper;

    @Transactional(readOnly = true)
    public PageResponse<LichSuOnResponse> list(Long userId, HistoryQuery query) {
        LocalDate tuNgay = parseDate(query.tuNgay(), "tuNgay");
        LocalDate denNgay = parseDate(query.denNgay(), "denNgay");
        if (tuNgay != null && denNgay != null && tuNgay.isAfter(denNgay)) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    "denNgay",
                    "Ngày kết thúc phải từ ngày bắt đầu trở đi"
            );
        }

        ZoneId zone = accountService.zoneOf(userId);
        Instant batDau = tuNgay == null
                ? null
                : tuNgay.atStartOfDay(zone).toInstant();
        Instant ketThuc = denNgay == null
                ? null
                : denNgay.plusDays(1).atStartOfDay(zone).toInstant();

        return PageResponse.of(history.history(
                userId,
                query.sessionId(),
                query.cardId(),
                query.deckId(),
                query.direction(),
                batDau,
                ketThuc,
                PageRequest.of(query.page(), query.size())
        ).map(this::toResponse));
    }

    private LichSuOnResponse toResponse(HistoryRow row) {
        return new LichSuOnResponse(
                String.valueOf(row.id()),
                String.valueOf(row.phienId()),
                String.valueOf(row.theId()),
                String.valueOf(row.boTheId()),
                row.tu(),
                row.tuLoai(),
                row.nghiaVi(),
                row.chieuHoc(),
                row.danhGia(),
                row.thoiGian(),
                jsonMapper.readValue(row.truocJson(), TienDoResponse.class),
                jsonMapper.readValue(row.sauJson(), TienDoResponse.class),
                row.phienBanThuatToan(),
                row.createdAt()
        );
    }

    private LocalDate parseDate(String value, String field) {
        if (value == null) {
            return null;
        }
        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException exception) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    field,
                    "Ngày không tồn tại"
            );
        }
    }
}
