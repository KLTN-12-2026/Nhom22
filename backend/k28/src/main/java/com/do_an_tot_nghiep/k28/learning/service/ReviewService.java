package com.do_an_tot_nghiep.k28.learning.service;

import com.do_an_tot_nghiep.k28.account.service.SettingsService;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.content.service.CardService;
import com.do_an_tot_nghiep.k28.learning.dto.ReviewRequest;
import com.do_an_tot_nghiep.k28.learning.dto.ReviewResponse;
import com.do_an_tot_nghiep.k28.learning.dto.TienDoResponse;
import com.do_an_tot_nghiep.k28.learning.entity.PhienHoc;
import com.do_an_tot_nghiep.k28.learning.entity.PhienHocThe;
import com.do_an_tot_nghiep.k28.learning.entity.SuDungHocNgay;
import com.do_an_tot_nghiep.k28.learning.entity.TienDoThe;
import com.do_an_tot_nghiep.k28.learning.entity.enums.ChieuHoc;
import com.do_an_tot_nghiep.k28.learning.entity.enums.DanhGia;
import com.do_an_tot_nghiep.k28.learning.entity.enums.TrangThaiPhienHoc;
import com.do_an_tot_nghiep.k28.learning.entity.enums.TrangThaiPhienHocThe;
import com.do_an_tot_nghiep.k28.learning.entity.enums.TrangThaiTienDo;
import com.do_an_tot_nghiep.k28.learning.repository.LichSuOnRepository;
import com.do_an_tot_nghiep.k28.learning.repository.PhienHocRepository;
import com.do_an_tot_nghiep.k28.learning.repository.PhienHocTheRepository;
import com.do_an_tot_nghiep.k28.learning.repository.ReviewEventRow;
import com.do_an_tot_nghiep.k28.learning.repository.SuDungHocNgayRepository;
import com.do_an_tot_nghiep.k28.learning.repository.TienDoTheRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private static final long MAX_ANSWER_MS = 120_000L;

    private final SrsCalculator calculator = new SrsCalculator();

    private final Clock clock;
    private final SettingsService settingsService;
    private final TienDoTheRepository progress;
    private final SuDungHocNgayRepository usage;
    private final PhienHocRepository sessions;
    private final PhienHocTheRepository queue;
    private final LichSuOnRepository history;
    private final CardService cardService;
    private final JsonMapper jsonMapper;

    public record Outcome(ReviewResponse body, boolean replayed) {
    }

    @Transactional
    public Outcome record(Long userId, Long sessionId, ReviewRequest request) {
        PhienHoc session = sessions.lockOwned(sessionId, userId)
                .orElseThrow(() -> new ApiException(
                        ErrorCode.NOT_FOUND, "Không tìm thấy phiên học"
                ));
        Instant hetGioAt = session.getBatDauAt()
                .plusSeconds(session.getQuyThoiGian() * 60L);

        Optional<ReviewEventRow> existing =
                history.findEvent(userId, request.clientEventId());
        if (existing.isPresent()) {
            return new Outcome(replay(sessionId, request, existing.get(), hetGioAt), true);
        }

        if (session.getTrangThai() != TrangThaiPhienHoc.DANG_HOC) {
            throw new ApiException(
                    ErrorCode.CONFLICT,
                    "Phiên học đã kết thúc. Các kết quả đã lưu vẫn được giữ."
            );
        }
        if (request.chieuHoc() != session.getChieuHoc()) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    "chieuHoc",
                    "Chiều học không khớp với phiên"
            );
        }

        Long theId = Long.valueOf(request.theId());
        PhienHocThe item = queue
                .findByPhienIdAndTheIdAndChieuHoc(sessionId, theId, session.getChieuHoc())
                .orElseThrow(() -> new ApiException(
                        ErrorCode.BUSINESS_RULE,
                        "Thẻ này không có trong hàng đợi của phiên"
                ));
        if (item.getTrangThai() == TrangThaiPhienHocThe.DA_TRA_LOI) {
            throw new ApiException(
                    ErrorCode.BUSINESS_RULE,
                    "Thẻ này đã được trả lời trong phiên"
            );
        }
        if (!cardService.isStudyable(userId, theId)) {
            throw new ApiException(
                    ErrorCode.BUSINESS_RULE,
                    "Thẻ này không còn khả dụng để học"
            );
        }

        Instant now = clock.instant();
        LocalDate homNay = LocalDate.ofInstant(now, ZoneId.of(session.getMuiGio()));

        Optional<TienDoThe> current = progress.findByNguoiDungIdAndTheIdAndChieuHoc(
                userId, theId, session.getChieuHoc()
        );
        if (current.isPresent()
                && current.get().getTrangThai() == TrangThaiTienDo.TAM_NGUNG) {
            throw new ApiException(
                    ErrorCode.BUSINESS_RULE,
                    "Thẻ này đang tạm ngưng học"
            );
        }

        boolean theMoiVatLy = !progress.existsByNguoiDungIdAndTheIdAndTrangThaiNot(
                userId, theId, TrangThaiTienDo.MOI
        );
        usage.ensureRow(userId, homNay, now);
        SuDungHocNgay dayUsage = usage
                .findByNguoiDungIdAndNgayDiaPhuong(userId, homNay)
                .orElseThrow();
        if (theMoiVatLy
                && dayUsage.getSoTheMoi()
                >= settingsService.learning(userId).tuMoiMoiNgay()) {
            throw new ApiException(
                    ErrorCode.BUSINESS_RULE,
                    "Bạn đã dùng hết suất từ mới hôm nay"
            );
        }

        long versionNow = current.map(TienDoThe::getVersion).orElse(0L);
        if (request.expectedVersion() != versionNow) {
            throw new ApiException(
                    ErrorCode.VERSION_CONFLICT,
                    "Thẻ này vừa được chấm ở nơi khác, hãy tải lại phiên học"
            );
        }

        SrsState before = current.map(TienDoThe::toState).orElseGet(SrsState::newCard);
        SrsState after = calculator.calculate(before, request.danhGia(), now);

        TienDoThe row = current.orElseGet(() -> progress.saveAndFlush(
                TienDoThe.create(userId, theId, session.getChieuHoc())
        ));
        row.apply(after);
        row = progress.saveAndFlush(row);

        TienDoResponse truoc = toResponse(before, versionNow);
        TienDoResponse sau = toResponse(after, row.getVersion());

        history.insertEvent(
                userId,
                request.clientEventId(),
                sessionId,
                row.getId(),
                request.danhGia().name(),
                (int) Math.min(request.thoiGianTraLoiMs(), MAX_ANSWER_MS),
                json(truoc),
                json(sau),
                SrsCalculator.VERSION,
                now
        );

        dayUsage.record(theMoiVatLy);
        usage.saveAndFlush(dayUsage);

        boolean lai = backInSession(after.trangThai(), after.hanOnAt(), hetGioAt);
        if (lai) {
            item.requeue(queue.maxThuTu(sessionId) + 1);
        } else {
            item.markAnswered();
        }
        queue.saveAndFlush(item);

        return new Outcome(
                new ReviewResponse(
                        request.clientEventId(),
                        request.theId(),
                        session.getChieuHoc(),
                        request.danhGia(),
                        truoc,
                        sau,
                        lai
                ),
                false
        );
    }

    private ReviewResponse replay(
            Long sessionId,
            ReviewRequest request,
            ReviewEventRow stored,
            Instant hetGioAt
    ) {
        ChieuHoc chieu = ChieuHoc.valueOf(stored.getChieuHoc());
        DanhGia danhGia = DanhGia.valueOf(stored.getDanhGia());
        if (!sessionId.equals(stored.getPhienId())
                || !request.theId().equals(String.valueOf(stored.getTheId()))
                || request.chieuHoc() != chieu
                || request.danhGia() != danhGia) {
            throw new ApiException(
                    ErrorCode.CONFLICT,
                    "Mã sự kiện này đã được dùng cho một lượt ôn khác"
            );
        }
        TienDoResponse truoc = jsonMapper.readValue(stored.getTruocJson(), TienDoResponse.class);
        TienDoResponse sau = jsonMapper.readValue(stored.getSauJson(), TienDoResponse.class);
        return new ReviewResponse(
                request.clientEventId(),
                request.theId(),
                chieu,
                danhGia,
                truoc,
                sau,
                backInSession(sau.trangThai(), sau.hanOnAt(), hetGioAt)
        );
    }

    private boolean backInSession(
            TrangThaiTienDo trangThai,
            Instant hanOnAt,
            Instant hetGioAt
    ) {
        return (trangThai == TrangThaiTienDo.DANG_HOC
                || trangThai == TrangThaiTienDo.HOC_LAI)
                && !hanOnAt.isAfter(hetGioAt);
    }

    private TienDoResponse toResponse(SrsState state, long version) {
        return new TienDoResponse(
                state.trangThai(),
                state.buocHoc(),
                state.ef(),
                state.khoangOnNgay(),
                state.chuoiThanhCong(),
                state.soLanQuen(),
                state.hanOnAt(),
                version
        );
    }

    private String json(TienDoResponse value) {
        return jsonMapper.writeValueAsString(value);
    }
}
