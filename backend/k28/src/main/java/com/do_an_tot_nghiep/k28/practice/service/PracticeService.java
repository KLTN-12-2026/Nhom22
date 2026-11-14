package com.do_an_tot_nghiep.k28.practice.service;

import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.content.dto.FileResponse;
import com.do_an_tot_nghiep.k28.content.dto.StudyCardResponse;
import com.do_an_tot_nghiep.k28.content.service.CardService;
import com.do_an_tot_nghiep.k28.content.service.FileService;
import com.do_an_tot_nghiep.k28.learning.entity.enums.TrangThaiTienDo;
import com.do_an_tot_nghiep.k28.practice.dto.CreatePracticeRequest;
import com.do_an_tot_nghiep.k28.practice.dto.PracticeQuestionResponse;
import com.do_an_tot_nghiep.k28.practice.dto.PracticeResultResponse;
import com.do_an_tot_nghiep.k28.practice.dto.PracticeSessionResponse;
import com.do_an_tot_nghiep.k28.practice.dto.RetryPracticeRequest;
import com.do_an_tot_nghiep.k28.practice.entity.BaiLuyen;
import com.do_an_tot_nghiep.k28.practice.entity.CauHoiBaiLuyen;
import com.do_an_tot_nghiep.k28.practice.entity.LanLamBai;
import com.do_an_tot_nghiep.k28.practice.entity.TraLoiBaiLuyen;
import com.do_an_tot_nghiep.k28.practice.entity.enums.LoaiBai;
import com.do_an_tot_nghiep.k28.practice.entity.enums.LoaiCau;
import com.do_an_tot_nghiep.k28.practice.entity.enums.NguonBaiLuyen;
import com.do_an_tot_nghiep.k28.practice.repository.BaiLuyenRepository;
import com.do_an_tot_nghiep.k28.practice.repository.CauHoiBaiLuyenRepository;
import com.do_an_tot_nghiep.k28.practice.repository.LanLamBaiRepository;
import com.do_an_tot_nghiep.k28.practice.repository.TraLoiBaiLuyenRepository;
import com.do_an_tot_nghiep.k28.speaking.service.TtsService;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@Service
@RequiredArgsConstructor
public class PracticeService {

    static final Set<Integer> SO_CAU = Set.of(5, 10, 20);
    static final String TAT_CA_BO = "Tất cả bộ của tôi";
    static final String SO_TAY_TEN = "Sổ tay từ khó";

    private final BaiLuyenRepository practices;
    private final CauHoiBaiLuyenRepository questions;
    private final LanLamBaiRepository attempts;
    private final TraLoiBaiLuyenRepository answers;
    private final PracticeResults results;
    private final CardService cardService;
    private final FileService fileService;
    private final TtsService ttsService;
    private final NotebookService notebookService;
    private final JsonMapper json;

    @Transactional
    public PracticeSessionResponse create(Long userId, CreatePracticeRequest request) {
        if (!SO_CAU.contains(request.soCau())) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "soCau", "Chọn 5, 10 hoặc 20 câu");
        }
        LoaiBai loaiBai = request.type();
        NguonBaiLuyen nguon = request.source();
        Long boTheId = request.deckId();
        List<Long> picked = request.cardIds();
        if (nguon == NguonBaiLuyen.SO_TAY && boTheId != null) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "boTheId", "Không chọn bộ thẻ khi luyện từ sổ tay");
        }
        if (!picked.isEmpty() && (nguon == NguonBaiLuyen.SO_TAY || boTheId != null)) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "theIds", "Không gửi theIds cùng bộ thẻ hoặc sổ tay");
        }

        String boTheTen = nguon == NguonBaiLuyen.SO_TAY ? SO_TAY_TEN : TAT_CA_BO;
        if (boTheId != null) {
            boTheTen = practices.ownedDeckName(userId, boTheId)
                    .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy bộ thẻ"));
        }
        if (!picked.isEmpty() && cardService.studyCards(userId, picked).size() != picked.size()) {
            throw new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy thẻ");
        }

        List<Long> usableIds = practices.usableCardIds(userId, TrangThaiTienDo.TAM_NGUNG);
        Map<Long, StudyCardResponse> cards = cardService.studyCards(userId, usableIds);
        List<StudyCardResponse> distract = pick(usableIds, cards);
        List<StudyCardResponse> pool;
        if (!picked.isEmpty()) {
            pool = pick(picked, cards);
        } else if (nguon == NguonBaiLuyen.SO_TAY) {
            pool = pick(notebookService.cardIds(userId), cards);
        } else if (boTheId != null) {
            String deck = String.valueOf(boTheId);
            pool = distract.stream().filter(card -> card.boTheId().equals(deck)).toList();
        } else {
            pool = distract;
        }
        if (pool.isEmpty()) {
            throw new ApiException(ErrorCode.BUSINESS_RULE, !picked.isEmpty()
                    ? "Các thẻ đã chọn đang tạm ngưng, chưa thể luyện."
                    : nguon == NguonBaiLuyen.SO_TAY
                    ? "Sổ tay đang trống, chưa có từ nào để luyện."
                    : "Chưa có thẻ nào để luyện. Thêm thẻ vào bộ trước.");
        }

        List<PracticeGenerator.Pair> pairs = loaiBai == LoaiBai.PHAN_BIET_CAP || loaiBai == LoaiBai.TONG_HOP
                ? pairsWithin(userId, pool)
                : List.of();
        List<PracticeGenerator.Draft> drafts = new PracticeGenerator(ThreadLocalRandom.current())
                .generate(loaiBai, request.soCau(), pool, distract, pairs);

        BaiLuyen practice = practices.save(BaiLuyen.create(userId, loaiBai, boTheId, nguon, request.soCau()));
        return toResponse(practice, boTheTen, saveQuestions(practice, drafts), null);
    }

    @Transactional(readOnly = true)
    public PracticeSessionResponse get(Long userId, Long id) {
        BaiLuyen practice = practices.findByIdAndNguoiDungId(id, userId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy bài luyện"));
        String boTheTen = results.boTheTen(practice);
        PracticeResultResponse ketQua = attempts.findByBaiId(practice.getId())
                .map(attempt -> results.result(practice, boTheTen, attempt))
                .orElse(null);
        return toResponse(practice, boTheTen, questions.findByBaiIdOrderByThuTu(practice.getId()), ketQua);
    }

    public FileResponse audio(Long userId, Long id, Long questionId) {
        BaiLuyen practice = practices.findByIdAndNguoiDungId(id, userId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy bài luyện"));
        CauHoiBaiLuyen question = questions.findByIdAndBaiId(questionId, practice.getId())
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy câu hỏi"));
        if (question.getLoaiCau() != LoaiCau.NGHE_VIET || question.getTheId() == null) {
            throw new ApiException(ErrorCode.NOT_FOUND, "Câu hỏi không có âm thanh");
        }
        JsonNode amTuId = json.readTree(question.getDeBaiJson()).get("amTuId");
        if (amTuId == null || amTuId.isNull()) {
            return ttsService.wordAudio(userId, question.getTheId());
        }
        try {
            return fileService.get(userId, Long.valueOf(amTuId.asText()));
        } catch (NumberFormatException e) {
            throw new ApiException(ErrorCode.NOT_FOUND, "Câu hỏi không có âm thanh");
        }
    }

    @Transactional
    public PracticeSessionResponse retry(Long userId, RetryPracticeRequest request) {
        LanLamBai attempt = attempts.findByIdAndNguoiDungId(request.attemptId(), userId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy lần làm bài"));
        BaiLuyen goc = practices.findByIdAndNguoiDungId(attempt.getBaiId(), userId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy bài luyện"));
        Map<Long, CauHoiBaiLuyen> rows = new HashMap<>();
        questions.findByBaiIdOrderByThuTu(goc.getId()).forEach(row -> rows.put(row.getId(), row));
        List<TraLoiBaiLuyen> wrong = answers.findByLanLamId(attempt.getId()).stream()
                .filter(answer -> !answer.isDung())
                .sorted(Comparator.comparingInt(answer -> rows.get(answer.getCauHoiId()).getThuTu()))
                .toList();
        if (wrong.isEmpty()) {
            throw new ApiException(ErrorCode.BUSINESS_RULE, "Bài này không có câu sai để luyện lại.");
        }

        List<Long> usableIds = practices.usableCardIds(userId, TrangThaiTienDo.TAM_NGUNG);
        Map<Long, StudyCardResponse> cards = cardService.studyCards(userId, usableIds);
        Map<Long, PracticeGenerator.Retry> items = new LinkedHashMap<>();
        for (TraLoiBaiLuyen answer : wrong) {
            CauHoiBaiLuyen row = rows.get(answer.getCauHoiId());
            PracticeGrader.Question key = results.question(row);
            switch (row.getLoaiCau()) {
                case GHEP_TU -> {
                    Set<Object> sai = results.stored(answer).chiTiet().stream()
                            .filter(detail -> Boolean.FALSE.equals(detail.get("dung")))
                            .map(detail -> detail.get("traiId"))
                            .collect(Collectors.toSet());
                    key.dapAn().cap().stream()
                            .filter(link -> sai.contains(link.traiId()))
                            .forEach(link -> addRetry(items, cards, LoaiCau.CHON_NGHIA,
                                    Long.valueOf(link.theId()), null, null));
                }
                case PHAN_BIET_CAP -> {
                    Long other = key.dapAn().luaChon().stream()
                            .filter(choice -> !choice.id().equals(key.dapAn().luaChonId()))
                            .map(choice -> Long.valueOf(choice.theId()))
                            .findFirst()
                            .orElse(null);
                    Long capId = key.dapAn().capId() == null ? null : Long.valueOf(key.dapAn().capId());
                    addRetry(items, cards, LoaiCau.PHAN_BIET_CAP, row.getTheId(), other, capId);
                }
                default -> addRetry(items, cards, row.getLoaiCau(), row.getTheId(), null, null);
            }
        }
        if (items.isEmpty()) {
            throw new ApiException(ErrorCode.BUSINESS_RULE,
                    "Các thẻ của câu sai đã bị xóa hoặc đang tạm ngưng nên chưa luyện lại được.");
        }

        LoaiBai loaiBai = goc.getLoaiBai() == LoaiBai.GHEP_TU ? LoaiBai.CHON_NGHIA : goc.getLoaiBai();
        List<PracticeGenerator.Draft> drafts = new PracticeGenerator(ThreadLocalRandom.current())
                .retry(loaiBai, List.copyOf(items.values()), pick(usableIds, cards));
        BaiLuyen practice = practices.save(BaiLuyen.createRetry(goc, loaiBai));
        return toResponse(practice, results.boTheTen(practice), saveQuestions(practice, drafts), null);
    }

    private void addRetry(
            Map<Long, PracticeGenerator.Retry> items,
            Map<Long, StudyCardResponse> cards,
            LoaiCau loaiCau,
            Long theId,
            Long otherId,
            Long capId
    ) {
        StudyCardResponse card = cards.get(theId);
        if (card != null && !items.containsKey(theId)) {
            items.put(theId, new PracticeGenerator.Retry(
                    loaiCau, card, otherId == null ? null : cards.get(otherId), capId));
        }
    }

    private List<CauHoiBaiLuyen> saveQuestions(BaiLuyen practice, List<PracticeGenerator.Draft> drafts) {
        return questions.saveAll(IntStream.range(0, drafts.size())
                .mapToObj(i -> {
                    PracticeGenerator.Draft draft = drafts.get(i);
                    return CauHoiBaiLuyen.create(
                            practice.getId(),
                            i + 1,
                            draft.loaiCau(),
                            draft.theId(),
                            json.writeValueAsString(draft.deBai()),
                            draft.phuongAn() == null ? null : json.writeValueAsString(draft.phuongAn()),
                            json.writeValueAsString(draft.dapAn()),
                            json.writeValueAsString(draft.giaiThich()));
                })
                .toList());
    }

    private List<PracticeGenerator.Pair> pairsWithin(Long userId, List<StudyCardResponse> pool) {
        Map<String, StudyCardResponse> byId = new HashMap<>();
        pool.forEach(card -> byId.put(card.id(), card));
        return practices.confusingPairs(userId).stream()
                .filter(row -> byId.containsKey(String.valueOf(row.getThe1Id()))
                        && byId.containsKey(String.valueOf(row.getThe2Id())))
                .map(row -> new PracticeGenerator.Pair(
                        row.getId(),
                        byId.get(String.valueOf(row.getThe1Id())),
                        byId.get(String.valueOf(row.getThe2Id()))))
                .toList();
    }

    private List<StudyCardResponse> pick(List<Long> ids, Map<Long, StudyCardResponse> cards) {
        Set<Long> seen = new HashSet<>();
        return ids.stream().filter(seen::add).map(cards::get).filter(Objects::nonNull).toList();
    }

    private PracticeSessionResponse toResponse(
            BaiLuyen practice,
            String boTheTen,
            List<CauHoiBaiLuyen> rows,
            PracticeResultResponse ketQua
    ) {
        return new PracticeSessionResponse(
                String.valueOf(practice.getId()),
                practice.getLoaiBai(),
                practice.getBoTheId() == null ? null : String.valueOf(practice.getBoTheId()),
                boTheTen,
                practice.getNguon(),
                rows.size(),
                practice.getSoCauYeuCau(),
                practice.getCreatedAt(),
                practice.isLaLuyenLai(),
                practice.getBaiGocId() == null ? null : String.valueOf(practice.getBaiGocId()),
                ketQua != null,
                ketQua == null ? null : ketQua.lanLamId(),
                rows.stream()
                        .map(row -> new PracticeQuestionResponse(
                                String.valueOf(row.getId()),
                                row.getThuTu(),
                                row.getLoaiCau(),
                                json.readTree(row.getDeBaiJson()),
                                row.getPhuongAnJson() == null ? null : json.readTree(row.getPhuongAnJson())))
                        .toList(),
                ketQua);
    }
}
