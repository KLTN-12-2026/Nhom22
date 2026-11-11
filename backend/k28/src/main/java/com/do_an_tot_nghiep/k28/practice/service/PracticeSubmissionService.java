package com.do_an_tot_nghiep.k28.practice.service;

import com.do_an_tot_nghiep.k28.account.service.AccountService;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.engagement.service.RewardService;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.practice.dto.PracticeAnswerRequest;
import com.do_an_tot_nghiep.k28.practice.dto.PracticePairRequest;
import com.do_an_tot_nghiep.k28.practice.dto.PracticeResultResponse;
import com.do_an_tot_nghiep.k28.practice.dto.SubmitPracticeRequest;
import com.do_an_tot_nghiep.k28.practice.entity.BaiLuyen;
import com.do_an_tot_nghiep.k28.practice.entity.CauHoiBaiLuyen;
import com.do_an_tot_nghiep.k28.practice.entity.LanLamBai;
import com.do_an_tot_nghiep.k28.practice.entity.LoiHocTap;
import com.do_an_tot_nghiep.k28.practice.entity.TraLoiBaiLuyen;
import com.do_an_tot_nghiep.k28.practice.entity.enums.LoaiCau;
import com.do_an_tot_nghiep.k28.practice.entity.enums.NguonSuKien;
import com.do_an_tot_nghiep.k28.practice.repository.BaiLuyenRepository;
import com.do_an_tot_nghiep.k28.practice.repository.CauHoiBaiLuyenRepository;
import com.do_an_tot_nghiep.k28.practice.repository.LanLamBaiRepository;
import com.do_an_tot_nghiep.k28.practice.repository.LoiHocTapRepository;
import com.do_an_tot_nghiep.k28.practice.repository.TraLoiBaiLuyenRepository;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

@Service
@RequiredArgsConstructor
public class PracticeSubmissionService {

    static final long MS_MOI_DON_VI = 120_000;

    private final BaiLuyenRepository practices;
    private final CauHoiBaiLuyenRepository questions;
    private final LanLamBaiRepository attempts;
    private final TraLoiBaiLuyenRepository answers;
    private final LoiHocTapRepository mistakes;
    private final PracticeResults results;
    private final JsonMapper json;
    private final Clock clock;
    private final AccountService accountService;
    private final RewardService rewardService;

    public record Outcome(boolean replayed, PracticeResultResponse body) {
    }

    private record CardPair(Long the1Id, Long the2Id) {

        static CardPair of(Long a, Long b) {
            return a < b ? new CardPair(a, b) : new CardPair(b, a);
        }
    }

    @Transactional
    public Outcome submit(Long userId, Long baiId, SubmitPracticeRequest request) {
        BaiLuyen practice = practices.lockOwned(baiId, userId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy bài luyện"));
        Optional<LanLamBai> prior = attempts.findByNguoiDungIdAndSubmitKey(userId, request.submitKey());
        if (prior.isPresent()) {
            if (!prior.get().getBaiId().equals(baiId)) {
                throw new ApiException(ErrorCode.CONFLICT, "submitKey", "Khóa nộp bài đã được dùng cho bài khác");
            }
            return new Outcome(true, results.result(practice, results.boTheTen(practice), prior.get()));
        }
        if (attempts.findByBaiId(baiId).isPresent()) {
            throw new ApiException(ErrorCode.CONFLICT, "Bài này đã được nộp. Mở lại bài để xem kết quả.");
        }

        List<CauHoiBaiLuyen> rows = questions.findByBaiIdOrderByThuTu(baiId);
        Map<Long, PracticeGrader.Question> keys = new HashMap<>();
        rows.forEach(row -> keys.put(row.getId(), results.question(row)));
        Map<Long, PracticeGrader.Answer> given = answersOf(request.traLoi(), keys);
        List<PracticeGrader.Graded> graded = rows.stream()
                .map(row -> PracticeGrader.grade(keys.get(row.getId()), given.get(row.getId())))
                .toList();

        Instant nopAt = clock.instant();
        LanLamBai attempt = attempts.save(LanLamBai.create(
                userId,
                baiId,
                request.submitKey(),
                (int) graded.stream().filter(PracticeGrader.Graded::dung).count(),
                rows.size(),
                PracticeGrader.score(graded),
                thoiGian(request.thoiGian(), practice, nopAt, keys.values()),
                nopAt));
        save(userId, practice, attempt, rows, graded);
        rewardService.practiced(
                userId,
                attempt.getId(),
                attempt.getSoCauDung(),
                practice.isLaLuyenLai(),
                LocalDate.ofInstant(nopAt, accountService.zoneOf(userId)));
        return new Outcome(false, results.result(practice, results.boTheTen(practice), attempt));
    }

    private void save(
            Long userId,
            BaiLuyen practice,
            LanLamBai attempt,
            List<CauHoiBaiLuyen> rows,
            List<PracticeGrader.Graded> graded
    ) {
        List<TraLoiBaiLuyen> saved = new ArrayList<>();
        List<LoiHocTap> loi = new ArrayList<>();
        Set<CardPair> nham = new TreeSet<>(Comparator.comparing(CardPair::the1Id).thenComparing(CardPair::the2Id));
        for (int i = 0; i < rows.size(); i++) {
            CauHoiBaiLuyen row = rows.get(i);
            PracticeGrader.Graded result = graded.get(i);
            saved.add(TraLoiBaiLuyen.create(
                    attempt.getId(),
                    row.getId(),
                    result.traLoi() == null ? null : json.writeValueAsString(result.traLoi()),
                    result.dung(),
                    results.stored(result)));
            for (PracticeGrader.Mistake mistake : result.loi()) {
                loi.add(LoiHocTap.create(
                        userId,
                        mistake.theId(),
                        mistake.nhomLoi(),
                        NguonSuKien.BAI_LUYEN,
                        attempt.getId(),
                        json.writeValueAsString(PracticeGrader.map(
                                "baiLuyenId", String.valueOf(practice.getId()),
                                "cauHoiId", String.valueOf(row.getId()),
                                "loaiCau", row.getLoaiCau(),
                                "traLoi", mistake.traLoi(),
                                "dapAn", mistake.dapAn(),
                                "theNhamId", mistake.theNhamId() == null ? null : String.valueOf(mistake.theNhamId())))));
            }
            result.nham().forEach(confusion -> nham.add(CardPair.of(confusion.theId(), confusion.theNhamId())));
        }
        answers.saveAll(saved);
        mistakes.saveAll(loi);
        nham.forEach(pair -> practices.addConfusion(userId, pair.the1Id(), pair.the2Id(), attempt.getNopAt()));
    }

    private int thoiGian(long requested, BaiLuyen practice, Instant nopAt, Collection<PracticeGrader.Question> keys) {
        long units = keys.stream()
                .mapToLong(key -> key.loaiCau() == LoaiCau.GHEP_TU ? key.dapAn().cap().size() : 1)
                .sum();
        long elapsed = Math.max(0, Duration.between(practice.getCreatedAt(), nopAt).toMillis());
        return (int) Math.min(requested, Math.min(elapsed, units * MS_MOI_DON_VI));
    }

    private Map<Long, PracticeGrader.Answer> answersOf(
            List<PracticeAnswerRequest> traLoi,
            Map<Long, PracticeGrader.Question> keys
    ) {
        Map<Long, PracticeGrader.Answer> result = new HashMap<>();
        for (int i = 0; i < traLoi.size(); i++) {
            PracticeAnswerRequest item = traLoi.get(i);
            String path = "traLoi[" + i + "]";
            PracticeGrader.Question key = keys.get(item.questionId());
            if (key == null) {
                throw invalid(path + ".cauHoiId", "Câu hỏi không thuộc bài luyện này");
            }
            if (result.containsKey(item.questionId())) {
                throw invalid(path + ".cauHoiId", "Mỗi câu hỏi chỉ được trả lời một lần");
            }
            result.put(item.questionId(), answer(key, item, path));
        }
        return result;
    }

    private PracticeGrader.Answer answer(PracticeGrader.Question key, PracticeAnswerRequest item, String path) {
        return switch (key.loaiCau()) {
            case CHON_NGHIA, CHON_TU, PHAN_BIET_CAP -> {
                if (item.luaChonId() != null && ids(key.phuongAn()).stream().noneMatch(item.luaChonId()::equals)) {
                    throw invalid(path + ".luaChonId", "Phương án không thuộc câu hỏi này");
                }
                yield new PracticeGrader.Answer(item.luaChonId(), null, null);
            }
            case GHEP_TU -> new PracticeGrader.Answer(null, null, pairs(key, item.cap(), path));
            case NHAP_TU_THEO_NGHIA, NGHE_VIET, DIEN_CHO_TRONG -> new PracticeGrader.Answer(null, item.noiDung(), null);
        };
    }

    private Map<String, String> pairs(PracticeGrader.Question key, List<PracticePairRequest> cap, String path) {
        Map<String, String> result = new LinkedHashMap<>();
        if (cap == null) {
            return result;
        }
        Set<String> trai = ids(key.cotTrai());
        Set<String> phai = ids(key.cotPhai());
        Set<String> used = new HashSet<>();
        for (int j = 0; j < cap.size(); j++) {
            PracticePairRequest pair = cap.get(j);
            String at = path + ".cap[" + j + "]";
            if (!trai.contains(pair.traiId()) || result.containsKey(pair.traiId())) {
                throw invalid(at + ".traiId", "Từ cần ghép không thuộc câu hỏi hoặc bị ghép hai lần");
            }
            if (!phai.contains(pair.phaiId()) || !used.add(pair.phaiId())) {
                throw invalid(at + ".phaiId", "Nghĩa không thuộc câu hỏi hoặc bị ghép hai lần");
            }
            result.put(pair.traiId(), pair.phaiId());
        }
        return result;
    }

    private static Set<String> ids(List<PracticeGrader.Option> options) {
        return options.stream().map(PracticeGrader.Option::id).collect(Collectors.toSet());
    }

    private static ApiException invalid(String field, String message) {
        return new ApiException(ErrorCode.VALIDATION_FAILED, field, message);
    }
}
