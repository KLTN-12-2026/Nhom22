package com.do_an_tot_nghiep.k28.practice.service;

import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.learning.entity.enums.DanhGia;
import com.do_an_tot_nghiep.k28.learning.entity.enums.TrangThaiTienDo;
import com.do_an_tot_nghiep.k28.practice.dto.BangChungResponse;
import com.do_an_tot_nghiep.k28.practice.dto.ConfusingPairResponse;
import com.do_an_tot_nghiep.k28.practice.dto.NhomLoiCountResponse;
import com.do_an_tot_nghiep.k28.practice.dto.NotebookItemResponse;
import com.do_an_tot_nghiep.k28.practice.dto.NotebookQuery;
import com.do_an_tot_nghiep.k28.practice.dto.NotebookResponse;
import com.do_an_tot_nghiep.k28.practice.dto.PairCardResponse;
import com.do_an_tot_nghiep.k28.practice.dto.UpdateNotebookRequest;
import com.do_an_tot_nghiep.k28.practice.entity.LoiHocTap;
import com.do_an_tot_nghiep.k28.practice.entity.SoTayTuKho;
import com.do_an_tot_nghiep.k28.practice.entity.enums.LoaiCau;
import com.do_an_tot_nghiep.k28.practice.entity.enums.MaLyDo;
import com.do_an_tot_nghiep.k28.practice.entity.enums.NhomLoi;
import com.do_an_tot_nghiep.k28.practice.repository.LapseStatRow;
import com.do_an_tot_nghiep.k28.practice.repository.LoiHocTapRepository;
import com.do_an_tot_nghiep.k28.practice.repository.MistakeStatRow;
import com.do_an_tot_nghiep.k28.practice.repository.NotebookCardRow;
import com.do_an_tot_nghiep.k28.practice.repository.SoTayTuKhoRepository;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

@Service
@RequiredArgsConstructor
public class NotebookService {

    private static final int BANG_CHUNG = 3;
    private static final int CAP_NHAM_TOI_DA = 20;
    private static final int GHI_CHU_TOI_DA = 500;
    private static final List<String> TONG_HOP = List.of(
            "TAT_CA", "NGHIA", "CHINH_TA", "NGHE", "NGU_CANH", "CAP_NHAM", "QUEN_NHIEU", "DANH_DAU");
    private static final Comparator<Entry> MOI_NHAT = Comparator
            .comparing(Entry::lanGanNhatAt, Comparator.nullsLast(Comparator.reverseOrder()))
            .thenComparing(entry -> entry.card().theId(), Comparator.reverseOrder());

    private final SoTayTuKhoRepository notebook;
    private final LoiHocTapRepository mistakes;
    private final JsonMapper json;
    private final Clock clock;

    @Value("${app.notebook.quen-nhieu:3}")
    private int quenNhieu;

    @Value("${app.notebook.quen-nhieu-ngay:30}")
    private int quenNhieuNgay;

    @Value("${app.notebook.chinh-ta-luot:5}")
    private int chinhTaLuot;

    @Value("${app.notebook.chinh-ta-sai:2}")
    private int chinhTaSai;

    @Value("${app.notebook.cap-nham:2}")
    private int capNham;

    @Transactional(readOnly = true)
    public NotebookResponse list(Long userId, NotebookQuery query) {
        List<Entry> all = entries(userId);
        Map<String, Integer> tongHop = new LinkedHashMap<>();
        TONG_HOP.forEach(key -> tongHop.put(key, (int) all.stream().filter(entry -> entry.in(key)).count()));
        List<Entry> matched = query.nhomLoi() == null
                ? all
                : all.stream().filter(entry -> entry.in(query.nhomLoi())).toList();
        int from = (int) Math.min((long) query.page() * query.size(), matched.size());
        List<Entry> page = matched.subList(from, Math.min(from + query.size(), matched.size()));
        Map<Long, List<BangChungResponse>> evidence = evidence(userId, page.stream().map(e -> e.card().theId()).toList());
        return new NotebookResponse(
                tongHop,
                page.stream().map(entry -> entry.toResponse(evidence.getOrDefault(entry.card().theId(), List.of()))).toList(),
                query.page(),
                query.size(),
                matched.size(),
                (matched.size() + query.size() - 1) / query.size());
    }

    @Transactional
    public NotebookItemResponse update(Long userId, Long cardId, UpdateNotebookRequest request) {
        if (request.ghiChu() == null && request.danhDauThuCong() == null) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "Gửi ghiChu hoặc danhDauThuCong");
        }
        String ghiChu = request.ghiChu() == null ? null : request.ghiChu().strip();
        if (ghiChu != null && ghiChu.codePointCount(0, ghiChu.length()) > GHI_CHU_TOI_DA) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "ghiChu", "Ghi chú tối đa 500 ký tự");
        }
        NotebookCardRow card = requireCard(userId, cardId);
        SoTayTuKho row = upsertRow(userId, cardId);
        row.update(ghiChu, request.danhDauThuCong());
        notebook.saveAndFlush(row);
        Long theId = card.theId();
        return entries(userId).stream()
                .filter(entry -> entry.card().theId().equals(theId))
                .findFirst()
                .orElseGet(() -> new Entry(card, Map.of(), List.of(), 0, row, null))
                .toResponse(evidence(userId, List.of(theId)).getOrDefault(theId, List.of()));
    }

    @Transactional
    public void remove(Long userId, Long cardId) {
        requireCard(userId, cardId);
        SoTayTuKho row = upsertRow(userId, cardId);
        row.hide(clock.instant().truncatedTo(ChronoUnit.MILLIS));
        notebook.saveAndFlush(row);
    }

    @Transactional(readOnly = true)
    public List<Long> cardIds(Long userId) {
        return entries(userId).stream().map(entry -> entry.card().theId()).toList();
    }

    @Transactional(readOnly = true)
    public List<ConfusingPairResponse> confusingPairs(Long userId) {
        List<SoTayTuKhoRepository.PairStatRow> pairs = notebook.pairStats(userId);
        Set<Long> ids = new HashSet<>();
        pairs.forEach(pair -> {
            ids.add(pair.getThe1Id());
            ids.add(pair.getThe2Id());
        });
        Map<Long, NotebookCardRow> cards = usableCards(userId, ids);
        return pairs.stream()
                .filter(pair -> cards.containsKey(pair.getThe1Id()) && cards.containsKey(pair.getThe2Id()))
                .limit(CAP_NHAM_TOI_DA)
                .map(pair -> new ConfusingPairResponse(
                        String.valueOf(pair.getId()),
                        pairCard(cards.get(pair.getThe1Id())),
                        pairCard(cards.get(pair.getThe2Id())),
                        pair.getSoLanNham(),
                        pair.getLanCuoiAt()))
                .toList();
    }

    private List<Entry> entries(Long userId) {
        Map<Long, SoTayTuKho> rows = new HashMap<>();
        notebook.findByNguoiDungId(userId).forEach(row -> rows.put(row.getTheId(), row));

        Map<Long, Map<NhomLoi, Long>> groups = new HashMap<>();
        Map<Long, Instant> latest = new HashMap<>();
        for (MistakeStatRow stat : notebook.mistakeStats(userId)) {
            groups.computeIfAbsent(stat.theId(), id -> new EnumMap<>(NhomLoi.class)).put(stat.nhomLoi(), stat.soLan());
            latest.merge(stat.theId(), stat.lanCuoiAt(), NotebookService::later);
        }

        Instant since = clock.instant().minus(Duration.ofDays(quenNhieuNgay));
        Map<Long, Integer> lapses = new HashMap<>();
        for (LapseStatRow stat : notebook.lapseStats(userId, since, DanhGia.QUEN, TrangThaiTienDo.ON_TAP.name())) {
            lapses.put(stat.theId(), stat.soLan().intValue());
            latest.merge(stat.theId(), stat.lanCuoiAt(), NotebookService::later);
        }

        Set<Long> members = new LinkedHashSet<>(groups.keySet());
        lapses.forEach((theId, count) -> {
            if (count >= quenNhieu) {
                members.add(theId);
            }
        });
        rows.values().stream().filter(SoTayTuKho::isDanhDauThuCong).forEach(row -> {
            members.add(row.getTheId());
            latest.merge(row.getTheId(), row.getUpdatedAt(), NotebookService::later);
        });
        if (members.isEmpty()) {
            return List.of();
        }

        Map<Long, NotebookCardRow> cards = usableCards(userId, members);
        Set<Long> spelling = new HashSet<>(notebook.spellingCardIds(userId, chinhTaLuot, chinhTaSai));
        Set<Long> paired = new HashSet<>();
        for (SoTayTuKhoRepository.PairStatRow pair : notebook.pairStats(userId)) {
            if (pair.getSoLanNham() >= capNham) {
                for (Long theId : List.of(pair.getThe1Id(), pair.getThe2Id())) {
                    SoTayTuKho row = rows.get(theId);
                    if (row == null || row.getAnTuAt() == null || pair.getLanCuoiAt().isAfter(row.getAnTuAt())) {
                        paired.add(theId);
                    }
                }
            }
        }

        List<Entry> entries = new ArrayList<>();
        for (Long theId : members) {
            NotebookCardRow card = cards.get(theId);
            if (card == null) {
                continue;
            }
            Map<NhomLoi, Long> group = groups.getOrDefault(theId, Map.of());
            int soLanQuen = lapses.getOrDefault(theId, 0);
            SoTayTuKho row = rows.get(theId);
            List<MaLyDo> lyDo = new ArrayList<>();
            if (soLanQuen >= quenNhieu) {
                lyDo.add(MaLyDo.QUEN_NHIEU);
            }
            if (spelling.contains(theId)) {
                lyDo.add(MaLyDo.SAI_CHINH_TA);
            }
            if (paired.contains(theId)) {
                lyDo.add(MaLyDo.CAP_DE_NHAM);
            }
            if (row != null && row.isDanhDauThuCong()) {
                lyDo.add(MaLyDo.DANH_DAU_THU_CONG);
            }
            entries.add(new Entry(card, group, lyDo, soLanQuen, row, latest.get(theId)));
        }
        entries.sort(MOI_NHAT);
        return entries;
    }

    private Map<Long, NotebookCardRow> usableCards(Long userId, Collection<Long> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        Set<Long> suspended = new HashSet<>(notebook.suspendedCardIds(userId, ids, TrangThaiTienDo.TAM_NGUNG));
        Map<Long, NotebookCardRow> cards = new HashMap<>();
        notebook.cards(userId, ids).stream()
                .filter(card -> !suspended.contains(card.theId()))
                .forEach(card -> cards.put(card.theId(), card));
        return cards;
    }

    private Map<Long, List<BangChungResponse>> evidence(Long userId, List<Long> theIds) {
        if (theIds.isEmpty()) {
            return Map.of();
        }
        List<Long> ids = notebook.evidenceIds(userId, theIds, BANG_CHUNG);
        if (ids.isEmpty()) {
            return Map.of();
        }
        Map<Long, List<BangChungResponse>> byCard = new HashMap<>();
        mistakes.findAllById(ids).stream()
                .sorted(Comparator.comparing(LoiHocTap::getCreatedAt).thenComparing(LoiHocTap::getId).reversed())
                .forEach(mistake -> byCard.computeIfAbsent(mistake.getTheId(), id -> new ArrayList<>())
                        .add(toEvidence(mistake)));
        return byCard;
    }

    private BangChungResponse toEvidence(LoiHocTap mistake) {
        Map<?, ?> data = json.readValue(mistake.getBangChungJson(), Map.class);
        Object loaiCau = data.get("loaiCau");
        return new BangChungResponse(
                mistake.getNhomLoi(),
                mistake.getNguonSuKien(),
                mistake.getSuKienId() == null ? null : String.valueOf(mistake.getSuKienId()),
                text(data.get("baiLuyenId")),
                text(data.get("cauHoiId")),
                loaiCau == null ? null : LoaiCau.valueOf(loaiCau.toString()),
                text(data.get("traLoi")),
                text(data.get("dapAn")),
                mistake.getCreatedAt());
    }

    private NotebookCardRow requireCard(Long userId, Long cardId) {
        return notebook.cards(userId, List.of(cardId)).stream()
                .findFirst()
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy thẻ"));
    }

    private SoTayTuKho upsertRow(Long userId, Long cardId) {
        notebook.insertIfAbsent(userId, cardId, clock.instant().truncatedTo(ChronoUnit.MILLIS));
        return notebook.findByNguoiDungIdAndTheId(userId, cardId).orElseThrow();
    }

    private static PairCardResponse pairCard(NotebookCardRow card) {
        return new PairCardResponse(
                String.valueOf(card.theId()), card.tu(), card.tuLoai(), card.phienAm(), card.nghiaVi(), card.viDuEn());
    }

    private static String text(Object value) {
        return value == null ? null : value.toString();
    }

    private static Instant later(Instant a, Instant b) {
        return a == null ? b : b == null || a.isAfter(b) ? a : b;
    }

    private record Entry(
            NotebookCardRow card,
            Map<NhomLoi, Long> nhomLoi,
            List<MaLyDo> lyDo,
            int soLanQuen,
            SoTayTuKho row,
            Instant lanGanNhatAt
    ) {

        boolean in(String key) {
            return switch (key) {
                case "TAT_CA" -> true;
                case "QUEN_NHIEU" -> lyDo.contains(MaLyDo.QUEN_NHIEU);
                case "DANH_DAU" -> row != null && row.isDanhDauThuCong();
                default -> nhomLoi.containsKey(NhomLoi.valueOf(key));
            };
        }

        NotebookItemResponse toResponse(List<BangChungResponse> bangChung) {
            return new NotebookItemResponse(
                    String.valueOf(card.theId()),
                    card.tu(),
                    card.tuLoai(),
                    card.phienAm(),
                    card.nghiaVi(),
                    String.valueOf(card.boTheId()),
                    card.boTheTen(),
                    nhomLoi.entrySet().stream()
                            .map(group -> new NhomLoiCountResponse(group.getKey(), group.getValue()))
                            .toList(),
                    lyDo,
                    bangChung,
                    soLanQuen,
                    row == null ? null : row.getGhiChu(),
                    row != null && row.isDanhDauThuCong(),
                    lanGanNhatAt);
        }
    }
}
