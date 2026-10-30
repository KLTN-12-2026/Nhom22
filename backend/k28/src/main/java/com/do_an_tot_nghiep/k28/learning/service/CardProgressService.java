package com.do_an_tot_nghiep.k28.learning.service;

import com.do_an_tot_nghiep.k28.account.service.AccountService;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.content.service.CardService;
import com.do_an_tot_nghiep.k28.learning.dto.CardProgressResponse;
import com.do_an_tot_nghiep.k28.learning.dto.ChieuTienDoResponse;
import com.do_an_tot_nghiep.k28.learning.dto.DeckProgressItemResponse;
import com.do_an_tot_nghiep.k28.learning.dto.DeckProgressQuery;
import com.do_an_tot_nghiep.k28.learning.dto.DeckProgressResponse;
import com.do_an_tot_nghiep.k28.learning.dto.NhomTienDo;
import com.do_an_tot_nghiep.k28.learning.dto.TienDoResponse;
import com.do_an_tot_nghiep.k28.learning.entity.TienDoThe;
import com.do_an_tot_nghiep.k28.learning.entity.enums.ChieuHoc;
import com.do_an_tot_nghiep.k28.learning.entity.enums.TrangThaiTienDo;
import com.do_an_tot_nghiep.k28.learning.repository.DeckProgressCountRow;
import com.do_an_tot_nghiep.k28.learning.repository.DeckProgressRow;
import com.do_an_tot_nghiep.k28.learning.repository.PhienHocRepository;
import com.do_an_tot_nghiep.k28.learning.repository.TienDoTheRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CardProgressService {

    private final Clock clock;
    private final AccountService accountService;
    private final PhienHocRepository sessions;
    private final TienDoTheRepository progress;
    private final CardService cardService;

    @Transactional(readOnly = true)
    public DeckProgressResponse deck(Long userId, Long deckId, DeckProgressQuery query) {
        String ten = sessions.ownedDeckName(userId, deckId)
                .orElseThrow(() -> new ApiException(
                        ErrorCode.NOT_FOUND,
                        "Không tìm thấy bộ thẻ"
                ));

        ZoneId zone = accountService.zoneOf(userId);
        LocalDate homNay = LocalDate.ofInstant(clock.instant(), zone);
        Instant batDau = homNay.atStartOfDay(zone).toInstant();
        Instant ketThuc = homNay.plusDays(1).atStartOfDay(zone).toInstant();

        long tongSoThe = progress.activeCardCount(deckId);
        DeckProgressCountRow counts = progress.deckProgressCount(
                userId, deckId, TrangThaiTienDo.MOI, TrangThaiTienDo.TAM_NGUNG,
                batDau, ketThuc
        );
        Map<NhomTienDo, Long> tongHop = new EnumMap<>(NhomTienDo.class);
        tongHop.put(NhomTienDo.MOI, 2 * tongSoThe - counts.tamNgung()
                - counts.quaHan() - counts.denHan() - counts.dangHoc());
        tongHop.put(NhomTienDo.DANG_HOC, counts.dangHoc());
        tongHop.put(NhomTienDo.DEN_HAN, counts.denHan());
        tongHop.put(NhomTienDo.QUA_HAN, counts.quaHan());
        tongHop.put(NhomTienDo.TAM_NGUNG, counts.tamNgung());

        Page<DeckProgressRow> page = progress.deckProgress(
                userId, deckId, ChieuHoc.EN_VI, ChieuHoc.VI_EN,
                TrangThaiTienDo.MOI, TrangThaiTienDo.TAM_NGUNG,
                batDau, ketThuc, query.searchPattern(), query.nhom(),
                PageRequest.of(query.page(), query.size())
        );

        List<Long> cardIds = page.getContent().stream().map(DeckProgressRow::theId).toList();
        Map<Long, Map<ChieuHoc, TienDoThe>> rowsByCard = new HashMap<>();
        if (!cardIds.isEmpty()) {
            progress.findByNguoiDungIdAndTheIdIn(userId, cardIds).forEach(row ->
                    rowsByCard.computeIfAbsent(row.getTheId(), id -> new EnumMap<>(ChieuHoc.class))
                            .put(row.getChieuHoc(), row)
            );
        }

        List<DeckProgressItemResponse> items = page.getContent().stream()
                .map(card -> {
                    Map<ChieuHoc, TienDoThe> rows = rowsByCard.getOrDefault(card.theId(), Map.of());
                    Map<ChieuHoc, ChieuTienDoResponse> chieu = new EnumMap<>(ChieuHoc.class);
                    for (ChieuHoc direction : ChieuHoc.values()) {
                        TienDoThe row = rows.get(direction);
                        chieu.put(direction, ChieuTienDoResponse.of(
                                TienDoResponse.of(row), groupOf(row, batDau, ketThuc)
                        ));
                    }
                    return new DeckProgressItemResponse(
                            String.valueOf(card.theId()),
                            card.tu(),
                            card.tuLoai(),
                            card.phienAm(),
                            card.nghiaVi(),
                            isSuspended(rows),
                            chieu
                    );
                })
                .toList();

        return new DeckProgressResponse(
                String.valueOf(deckId),
                ten,
                zone.getId(),
                tongSoThe,
                tongHop,
                items,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages()
        );
    }

    @Transactional
    public CardProgressResponse suspend(Long userId, Long cardId, boolean tamNgung) {
        requireCard(userId, cardId);
        Map<ChieuHoc, TienDoThe> rows = rowsOf(userId, cardId);

        for (ChieuHoc direction : ChieuHoc.values()) {
            TienDoThe row = rows.get(direction);
            if (tamNgung && row == null) {
                row = TienDoThe.create(userId, cardId, direction);
                row.suspend();
                rows.put(direction, progress.saveAndFlush(row));
            } else if (tamNgung && row.suspend()) {
                progress.saveAndFlush(row);
            } else if (!tamNgung && row != null && row.resume()) {
                progress.saveAndFlush(row);
            }
        }

        return toResponse(cardId, rows);
    }

    @Transactional
    public CardProgressResponse reset(Long userId, Long cardId) {
        requireCard(userId, cardId);
        Map<ChieuHoc, TienDoThe> rows = rowsOf(userId, cardId);

        for (TienDoThe row : rows.values()) {
            if (row.reset()) {
                progress.saveAndFlush(row);
            }
        }

        return toResponse(cardId, rows);
    }

    private void requireCard(Long userId, Long cardId) {
        if (!cardService.isStudyable(userId, cardId)) {
            throw new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy thẻ");
        }
    }

    private Map<ChieuHoc, TienDoThe> rowsOf(Long userId, Long cardId) {
        Map<ChieuHoc, TienDoThe> rows = new EnumMap<>(ChieuHoc.class);
        progress.findByNguoiDungIdAndTheId(userId, cardId)
                .forEach(row -> rows.put(row.getChieuHoc(), row));
        return rows;
    }

    private CardProgressResponse toResponse(Long cardId, Map<ChieuHoc, TienDoThe> rows) {
        Map<ChieuHoc, TienDoResponse> chieu = new EnumMap<>(ChieuHoc.class);
        for (ChieuHoc direction : ChieuHoc.values()) {
            chieu.put(direction, TienDoResponse.of(rows.get(direction)));
        }
        return new CardProgressResponse(String.valueOf(cardId), isSuspended(rows), chieu);
    }

    private boolean isSuspended(Map<ChieuHoc, TienDoThe> rows) {
        for (ChieuHoc direction : ChieuHoc.values()) {
            TienDoThe row = rows.get(direction);
            if (row == null || row.getTrangThai() != TrangThaiTienDo.TAM_NGUNG) {
                return false;
            }
        }
        return true;
    }

    private NhomTienDo groupOf(TienDoThe row, Instant batDau, Instant ketThuc) {
        if (row == null || row.getTrangThai() == TrangThaiTienDo.MOI) {
            return NhomTienDo.MOI;
        }
        if (row.getTrangThai() == TrangThaiTienDo.TAM_NGUNG) {
            return NhomTienDo.TAM_NGUNG;
        }
        if (row.getHanOnAt().isBefore(batDau)) {
            return NhomTienDo.QUA_HAN;
        }
        if (row.getHanOnAt().isBefore(ketThuc)) {
            return NhomTienDo.DEN_HAN;
        }
        return NhomTienDo.DANG_HOC;
    }
}
