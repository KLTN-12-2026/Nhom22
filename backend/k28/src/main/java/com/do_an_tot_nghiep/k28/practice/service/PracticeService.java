package com.do_an_tot_nghiep.k28.practice.service;

import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.content.dto.StudyCardResponse;
import com.do_an_tot_nghiep.k28.content.service.CardService;
import com.do_an_tot_nghiep.k28.learning.entity.enums.TrangThaiTienDo;
import com.do_an_tot_nghiep.k28.practice.dto.CreatePracticeRequest;
import com.do_an_tot_nghiep.k28.practice.dto.PracticeQuestionResponse;
import com.do_an_tot_nghiep.k28.practice.dto.PracticeSessionResponse;
import com.do_an_tot_nghiep.k28.practice.entity.BaiLuyen;
import com.do_an_tot_nghiep.k28.practice.entity.CauHoiBaiLuyen;
import com.do_an_tot_nghiep.k28.practice.entity.enums.LoaiBai;
import com.do_an_tot_nghiep.k28.practice.entity.enums.NguonBaiLuyen;
import com.do_an_tot_nghiep.k28.practice.repository.BaiLuyenRepository;
import com.do_an_tot_nghiep.k28.practice.repository.CauHoiBaiLuyenRepository;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.IntStream;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

@Service
@RequiredArgsConstructor
public class PracticeService {

    static final Set<Integer> SO_CAU = Set.of(5, 10, 20);
    static final String TAT_CA_BO = "Tất cả bộ của tôi";
    static final String SO_TAY_TEN = "Sổ tay từ khó";

    private final BaiLuyenRepository practices;
    private final CauHoiBaiLuyenRepository questions;
    private final CardService cardService;
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
            pool = pick(practices.notebookCardIds(userId), cards);
        } else if (boTheId != null) {
            String deck = String.valueOf(boTheId);
            pool = distract.stream().filter(card -> card.boTheId().equals(deck)).toList();
        } else {
            pool = distract;
        }
        if (pool.isEmpty()) {
            throw new ApiException(ErrorCode.BUSINESS_RULE, nguon == NguonBaiLuyen.SO_TAY
                    ? "Sổ tay đang trống, chưa có từ nào để luyện."
                    : "Chưa có thẻ nào để luyện. Thêm thẻ vào bộ trước.");
        }

        List<PracticeGenerator.Pair> pairs = loaiBai == LoaiBai.PHAN_BIET_CAP || loaiBai == LoaiBai.TONG_HOP
                ? pairsWithin(userId, pool)
                : List.of();
        List<PracticeGenerator.Draft> drafts = new PracticeGenerator(ThreadLocalRandom.current())
                .generate(loaiBai, request.soCau(), pool, distract, pairs);

        BaiLuyen practice = practices.save(BaiLuyen.create(userId, loaiBai, boTheId, nguon, request.soCau()));
        List<CauHoiBaiLuyen> saved = questions.saveAll(IntStream.range(0, drafts.size())
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
        return toResponse(practice, boTheTen, saved);
    }

    @Transactional(readOnly = true)
    public PracticeSessionResponse get(Long userId, Long id) {
        BaiLuyen practice = practices.findByIdAndNguoiDungId(id, userId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy bài luyện"));
        String boTheTen = practice.getBoTheId() != null
                ? practices.deckName(practice.getBoTheId()).orElse(TAT_CA_BO)
                : practice.getNguon() == NguonBaiLuyen.SO_TAY ? SO_TAY_TEN : TAT_CA_BO;
        return toResponse(practice, boTheTen, questions.findByBaiIdOrderByThuTu(practice.getId()));
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

    private PracticeSessionResponse toResponse(BaiLuyen practice, String boTheTen, List<CauHoiBaiLuyen> rows) {
        return new PracticeSessionResponse(
                String.valueOf(practice.getId()),
                practice.getLoaiBai(),
                practice.getBoTheId() == null ? null : String.valueOf(practice.getBoTheId()),
                boTheTen,
                practice.getNguon(),
                rows.size(),
                practice.getSoCauYeuCau(),
                practice.getCreatedAt(),
                rows.stream()
                        .map(row -> new PracticeQuestionResponse(
                                String.valueOf(row.getId()),
                                row.getThuTu(),
                                row.getLoaiCau(),
                                json.readTree(row.getDeBaiJson()),
                                row.getPhuongAnJson() == null ? null : json.readTree(row.getPhuongAnJson())))
                        .toList());
    }
}
