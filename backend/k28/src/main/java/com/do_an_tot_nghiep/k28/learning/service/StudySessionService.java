package com.do_an_tot_nghiep.k28.learning.service;

import com.do_an_tot_nghiep.k28.account.service.AccountService;
import com.do_an_tot_nghiep.k28.account.service.SettingsService;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.content.dto.StudyCardResponse;
import com.do_an_tot_nghiep.k28.content.service.CardService;
import com.do_an_tot_nghiep.k28.learning.dto.CreateSessionRequest;
import com.do_an_tot_nghiep.k28.learning.dto.LichTiepTheoResponse;
import com.do_an_tot_nghiep.k28.learning.dto.SessionSummaryResponse;
import com.do_an_tot_nghiep.k28.learning.dto.StudyQueueItemResponse;
import com.do_an_tot_nghiep.k28.learning.dto.StudySessionResponse;
import com.do_an_tot_nghiep.k28.learning.dto.TienDoResponse;
import com.do_an_tot_nghiep.k28.learning.dto.TuCanLuyenResponse;
import com.do_an_tot_nghiep.k28.learning.entity.PhienHoc;
import com.do_an_tot_nghiep.k28.learning.entity.PhienHocThe;
import com.do_an_tot_nghiep.k28.learning.entity.SuDungHocNgay;
import com.do_an_tot_nghiep.k28.learning.entity.TienDoThe;
import com.do_an_tot_nghiep.k28.learning.entity.enums.ChieuHoc;
import com.do_an_tot_nghiep.k28.learning.entity.enums.DanhGia;
import com.do_an_tot_nghiep.k28.learning.entity.enums.TrangThaiPhienHocThe;
import com.do_an_tot_nghiep.k28.learning.entity.enums.TrangThaiTienDo;
import com.do_an_tot_nghiep.k28.learning.repository.HistoryRow;
import com.do_an_tot_nghiep.k28.learning.repository.LichSuOnRepository;
import com.do_an_tot_nghiep.k28.learning.repository.PhienHocRepository;
import com.do_an_tot_nghiep.k28.learning.repository.PhienHocTheRepository;
import com.do_an_tot_nghiep.k28.learning.repository.SuDungHocNgayRepository;
import com.do_an_tot_nghiep.k28.learning.repository.TienDoTheRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

@Service
@RequiredArgsConstructor
public class StudySessionService {

    private static final String TAT_CA_BO = "Tất cả bộ của tôi";
    private static final Set<Integer> QUY_THOI_GIAN = Set.of(5, 10, 20);
    private static final List<TrangThaiTienDo> TRANG_THAI_BUOC = List.of(
            TrangThaiTienDo.DANG_HOC,
            TrangThaiTienDo.HOC_LAI
    );
    private static final List<TrangThaiTienDo> TRANG_THAI_ON = List.of(
            TrangThaiTienDo.ON_TAP
    );

    private final Clock clock;
    private final AccountService accountService;
    private final SettingsService settingsService;
    private final TienDoTheRepository progress;
    private final SuDungHocNgayRepository usage;
    private final PhienHocRepository sessions;
    private final PhienHocTheRepository queue;
    private final CardService cardService;
    private final LichSuOnRepository history;
    private final JsonMapper jsonMapper;

    @Transactional
    public StudySessionResponse create(Long userId, CreateSessionRequest request) {
        int quyThoiGian = request.quyThoiGian();
        if (!QUY_THOI_GIAN.contains(quyThoiGian)) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    "quyThoiGian",
                    "Chọn 5, 10 hoặc 20 phút"
            );
        }

        Long boTheId = request.boTheId() == null
                ? null
                : Long.valueOf(request.boTheId());
        String boTheTen = TAT_CA_BO;
        if (boTheId != null) {
            boTheTen = sessions.ownedDeckName(userId, boTheId)
                    .orElseThrow(() -> new ApiException(
                            ErrorCode.NOT_FOUND,
                            "Không tìm thấy bộ thẻ"
                    ));
        }

        ZoneId zone = accountService.zoneOf(userId);
        Instant now = clock.instant();
        LocalDate homNay = LocalDate.ofInstant(now, zone);
        ChieuHoc chieu = request.chieuHoc();
        int cap = quyThoiGian * 60 / LearningPlanService.GIAY_MOI_LUOT;

        List<Long> cardIds = pickCardIds(
                userId, chieu, boTheId, now, homNay, cap
        );
        if (cardIds.isEmpty()) {
            throw new ApiException(
                    ErrorCode.BUSINESS_RULE,
                    "Chưa có thẻ nào cần học lúc này ở chiều đã chọn. "
                            + "Thẻ đến hạn tiếp theo sẽ xuất hiện đúng giờ, "
                            + "hoặc thêm thẻ mới vào bộ."
            );
        }

        PhienHoc session = sessions.save(PhienHoc.start(
                userId, boTheId, chieu, zone.getId(), now, quyThoiGian
        ));
        List<PhienHocThe> rows = queue.saveAll(
                IntStream.range(0, cardIds.size())
                        .mapToObj(i -> PhienHocThe.queued(
                                session.getId(), cardIds.get(i), chieu, i + 1
                        ))
                        .toList()
        );

        return toResponse(userId, session, boTheTen, rows);
    }

    @Transactional(readOnly = true)
    public StudySessionResponse get(Long userId, Long id) {
        PhienHoc session = sessions.findByIdAndNguoiDungId(id, userId)
                .orElseThrow(() -> new ApiException(
                        ErrorCode.NOT_FOUND,
                        "Không tìm thấy phiên học"
                ));

        return toResponse(
                userId,
                session,
                deckNameOf(session),
                queue.findByPhienIdOrderByThuTu(session.getId())
        );
    }

    @Transactional
    public SessionSummaryResponse finish(Long userId, Long id) {
        PhienHoc session = sessions.lockOwned(id, userId)
                .orElseThrow(() -> new ApiException(
                        ErrorCode.NOT_FOUND,
                        "Không tìm thấy phiên học"
                ));
        session.finish(clock.instant());
        return summary(userId, session);
    }

    private SessionSummaryResponse summary(Long userId, PhienHoc session) {
        List<HistoryRow> events = history.sessionEvents(userId, session.getId());
        Map<Long, List<HistoryRow>> byCard = events.stream()
                .collect(Collectors.groupingBy(
                        HistoryRow::theId, LinkedHashMap::new, Collectors.toList()
                ));

        Map<DanhGia, Integer> theoDanhGia = new EnumMap<>(DanhGia.class);
        for (DanhGia danhGia : DanhGia.values()) {
            theoDanhGia.put(danhGia, 0);
        }
        events.forEach(event -> theoDanhGia.merge(event.danhGia(), 1, Integer::sum));

        int soTheMoi = (int) byCard.values().stream()
                .filter(rows -> tienDo(rows.getFirst().truocJson()).trangThai()
                        == TrangThaiTienDo.MOI)
                .count();

        List<TuCanLuyenResponse> tuCanLuyen = byCard.values().stream()
                .filter(rows -> rows.stream().anyMatch(row ->
                        row.danhGia() == DanhGia.QUEN || row.danhGia() == DanhGia.KHO))
                .map(rows -> {
                    HistoryRow first = rows.getFirst();
                    return new TuCanLuyenResponse(
                            String.valueOf(first.theId()),
                            first.tu(),
                            first.tuLoai(),
                            first.nghiaVi(),
                            rows.stream().map(HistoryRow::danhGia).toList()
                    );
                })
                .toList();

        List<LichTiepTheoResponse> lichTiepTheo = byCard.values().stream()
                .map(rows -> {
                    HistoryRow last = rows.getLast();
                    TienDoResponse sau = tienDo(last.sauJson());
                    return new LichTiepTheoResponse(
                            String.valueOf(last.theId()),
                            last.tu(),
                            sau.trangThai(),
                            sau.hanOnAt()
                    );
                })
                .sorted(Comparator.comparing(
                        LichTiepTheoResponse::hanOnAt,
                        Comparator.nullsLast(Comparator.naturalOrder())
                ))
                .toList();

        return new SessionSummaryResponse(
                String.valueOf(session.getId()),
                session.getBoTheId() == null
                        ? null
                        : String.valueOf(session.getBoTheId()),
                deckNameOf(session),
                session.getChieuHoc(),
                session.getQuyThoiGian(),
                session.getBatDauAt(),
                session.hetGioAt(),
                session.getKetThucAt(),
                session.getTrangThai(),
                events.size(),
                byCard.size(),
                soTheMoi,
                queue.countByPhienIdAndTrangThai(
                        session.getId(), TrangThaiPhienHocThe.CHUA_TRA_LOI
                ),
                events.stream().mapToLong(HistoryRow::thoiGian).sum(),
                theoDanhGia,
                tuCanLuyen,
                lichTiepTheo
        );
    }

    private String deckNameOf(PhienHoc session) {
        return session.getBoTheId() == null
                ? TAT_CA_BO
                : sessions.deckName(session.getBoTheId()).orElse(TAT_CA_BO);
    }

    private TienDoResponse tienDo(String json) {
        return jsonMapper.readValue(json, TienDoResponse.class);
    }

    private List<Long> pickCardIds(
            Long userId,
            ChieuHoc chieu,
            Long boTheId,
            Instant now,
            LocalDate homNay,
            int cap
    ) {
        Pageable page = PageRequest.ofSize(cap);
        LinkedHashSet<Long> picked = new LinkedHashSet<>();

        progress.dueQueue(userId, chieu, TRANG_THAI_BUOC, now, boTheId, page)
                .forEach(row -> picked.add(row.getTheId()));
        progress.dueQueue(userId, chieu, TRANG_THAI_ON, now, boTheId, page)
                .forEach(row -> picked.add(row.getTheId()));

        int soMoiConLai = soMoiConLai(userId, homNay);
        if (soMoiConLai > 0) {
            picked.addAll(progress.physicallyNewCardIds(
                    userId,
                    boTheId,
                    TrangThaiTienDo.MOI,
                    PageRequest.ofSize(Math.min(cap, soMoiConLai))
            ));
        }

        picked.addAll(progress.otherDirectionCardIds(
                userId, chieu, boTheId, TrangThaiTienDo.MOI, page
        ));

        return picked.stream().limit(cap).toList();
    }

    private int soMoiConLai(Long userId, LocalDate homNay) {
        int tuMoiMoiNgay = settingsService.learning(userId).tuMoiMoiNgay();
        int daHoc = usage.findByNguoiDungIdAndNgayDiaPhuong(userId, homNay)
                .map(SuDungHocNgay::getSoTheMoi)
                .orElse(0);
        return Math.max(0, tuMoiMoiNgay - daHoc);
    }

    private StudySessionResponse toResponse(
            Long userId,
            PhienHoc session,
            String boTheTen,
            List<PhienHocThe> rows
    ) {
        List<Long> cardIds = rows.stream().map(PhienHocThe::getTheId).toList();
        Map<Long, StudyCardResponse> cards =
                cardService.studyCards(userId, cardIds);
        Map<Long, TienDoThe> progressByCard =
                progress.findByNguoiDungIdAndChieuHocAndTheIdIn(
                                userId, session.getChieuHoc(), cardIds
                        ).stream()
                        .collect(Collectors.toMap(
                                TienDoThe::getTheId, Function.identity()
                        ));

        List<StudyQueueItemResponse> hangDoi = rows.stream()
                .map(row -> new StudyQueueItemResponse(
                        String.valueOf(row.getTheId()),
                        row.getThuTu(),
                        row.getTrangThai(),
                        TienDoResponse.of(progressByCard.get(row.getTheId())),
                        cards.get(row.getTheId())
                ))
                .toList();

        return new StudySessionResponse(
                String.valueOf(session.getId()),
                session.getBoTheId() == null
                        ? null
                        : String.valueOf(session.getBoTheId()),
                boTheTen,
                session.getChieuHoc(),
                session.getQuyThoiGian(),
                session.getBatDauAt(),
                session.hetGioAt(),
                session.getKetThucAt(),
                session.getTrangThai(),
                session.getMuiGio(),
                hangDoi
        );
    }
}
