package com.do_an_tot_nghiep.k28.practice.service;

import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.content.dto.StudyCardResponse;
import com.do_an_tot_nghiep.k28.practice.entity.enums.LoaiBai;
import com.do_an_tot_nghiep.k28.practice.entity.enums.LoaiCau;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Random;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

final class PracticeGenerator {

    static final List<LoaiCau> TONG_HOP = List.of(
            LoaiCau.CHON_NGHIA,
            LoaiCau.DIEN_CHO_TRONG,
            LoaiCau.NGHE_VIET,
            LoaiCau.CHON_TU,
            LoaiCau.NHAP_TU_THEO_NGHIA
    );
    static final int SO_PHUONG_AN = 4;
    static final int NHOM_GHEP_TOI_DA = 5;
    static final int NHOM_GHEP_TOI_THIEU = 3;

    record Draft(
            LoaiCau loaiCau,
            Long theId,
            Map<String, Object> deBai,
            List<Map<String, Object>> phuongAn,
            Map<String, Object> dapAn,
            Object giaiThich
    ) {
    }

    record Pair(Long id, StudyCardResponse first, StudyCardResponse second) {
    }

    private record Blank(String cau, String dapAn) {
    }

    private final Random random;

    PracticeGenerator(Random random) {
        this.random = random;
    }

    List<Draft> generate(
            LoaiBai loaiBai,
            int soCau,
            List<StudyCardResponse> pool,
            List<StudyCardResponse> distract,
            List<Pair> pairs
    ) {
        List<Draft> drafts = switch (loaiBai) {
            case PHAN_BIET_CAP -> pairDrafts(soCau, pairs);
            case GHEP_TU -> matchDrafts(soCau, pool, distract);
            default -> singleDrafts(loaiBai, soCau, pool, distract, pairs);
        };
        if (drafts.isEmpty()) {
            throw rule(switch (loaiBai) {
                case DIEN_CHO_TRONG -> "Các thẻ đã chọn chưa có câu ví dụ chứa đúng từ, nên chưa tạo được câu điền chỗ trống.";
                case NGHE_VIET -> "Các thẻ đã chọn chưa có âm thanh của từ, nên chưa tạo được câu nghe viết.";
                default -> "Chưa tạo được câu hỏi từ các thẻ đã chọn.";
            });
        }
        return drafts;
    }

    static String normalize(String value) {
        return value == null
                ? ""
                : Normalizer.normalize(value, Normalizer.Form.NFC).trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
    }

    private List<Draft> pairDrafts(int soCau, List<Pair> pairs) {
        if (pairs.isEmpty()) {
            throw rule("Bạn chưa có cặp từ dễ nhầm. Cặp được ghi nhận khi bạn chọn nhầm giữa hai từ trong bài luyện.");
        }
        List<Draft> drafts = new ArrayList<>();
        for (Pair pair : shuffled(pairs)) {
            if (drafts.size() < soCau) {
                drafts.add(pairQuestion(pair.first(), pair.second(), pair.id()));
            }
            if (drafts.size() < soCau) {
                drafts.add(pairQuestion(pair.second(), pair.first(), pair.id()));
            }
        }
        return drafts;
    }

    private List<Draft> matchDrafts(int soCau, List<StudyCardResponse> pool, List<StudyCardResponse> distract) {
        List<StudyCardResponse> chosen = distinctCards(shuffled(pool), List.of(), soCau);
        List<Draft> drafts = new ArrayList<>();
        for (int i = 0; i < chosen.size(); i += NHOM_GHEP_TOI_DA) {
            List<StudyCardResponse> group = chosen.subList(i, Math.min(i + NHOM_GHEP_TOI_DA, chosen.size()));
            if (group.size() < NHOM_GHEP_TOI_THIEU) {
                group = distinctCards(shuffled(distract), group, NHOM_GHEP_TOI_THIEU);
            }
            if (group.size() < NHOM_GHEP_TOI_THIEU) {
                throw rule("Cần ít nhất 3 thẻ khác từ và khác nghĩa để làm bài ghép từ.");
            }
            drafts.add(matchQuestion(group));
        }
        return drafts;
    }

    private List<Draft> singleDrafts(
            LoaiBai loaiBai,
            int soCau,
            List<StudyCardResponse> pool,
            List<StudyCardResponse> distract,
            List<Pair> pairs
    ) {
        boolean needsOptions = loaiBai == LoaiBai.CHON_NGHIA || loaiBai == LoaiBai.CHON_TU || loaiBai == LoaiBai.TONG_HOP;
        if (needsOptions && distract.size() < SO_PHUONG_AN) {
            throw rule("Cần ít nhất 4 thẻ trong các bộ của bạn để tạo phương án nhiễu.");
        }
        List<LoaiCau> types = loaiBai == LoaiBai.TONG_HOP ? TONG_HOP : List.of(LoaiCau.valueOf(loaiBai.name()));
        List<StudyCardResponse> order = shuffled(pool);
        List<Draft> drafts = new ArrayList<>();
        for (int i = 0; i < order.size() && drafts.size() < soCau; i++) {
            for (int k = 0; k < types.size(); k++) {
                Draft draft = single(types.get((i + k) % types.size()), order.get(i), distract);
                if (draft != null) {
                    drafts.add(draft);
                    break;
                }
            }
        }
        if (loaiBai == LoaiBai.TONG_HOP && !pairs.isEmpty() && drafts.size() < soCau) {
            Pair pair = pairs.get(0);
            drafts.add(pairQuestion(pair.first(), pair.second(), pair.id()));
        }
        return drafts;
    }

    private Draft single(LoaiCau type, StudyCardResponse card, List<StudyCardResponse> distract) {
        return switch (type) {
            case CHON_NGHIA, CHON_TU -> choiceQuestion(type, card, distract);
            case DIEN_CHO_TRONG -> blankQuestion(card);
            case NHAP_TU_THEO_NGHIA -> new Draft(
                    type,
                    Long.valueOf(card.id()),
                    map("nghiaVi", card.nghiaVi(), "tuLoai", card.tuLoai(), "viDuVi", card.dichVi()),
                    null,
                    typedAnswer(card.tu()),
                    explain(card));
            case NGHE_VIET -> card.amTuId() == null ? null : new Draft(
                    type,
                    Long.valueOf(card.id()),
                    map("amTuId", card.amTuId(), "tuLoai", card.tuLoai()),
                    null,
                    typedAnswer(card.tu()),
                    explain(card));
            default -> null;
        };
    }

    private Draft choiceQuestion(LoaiCau type, StudyCardResponse card, List<StudyCardResponse> distract) {
        List<StudyCardResponse> options = distinctCards(shuffled(distract), List.of(card), SO_PHUONG_AN);
        if (options.size() < SO_PHUONG_AN) {
            return null;
        }
        boolean meaning = type == LoaiCau.CHON_NGHIA;
        List<Map<String, Object>> phuongAn = new ArrayList<>();
        List<Map<String, Object>> luaChon = new ArrayList<>();
        String answer = null;
        List<StudyCardResponse> order = shuffled(options);
        for (int i = 0; i < order.size(); i++) {
            StudyCardResponse option = order.get(i);
            String id = "o" + (i + 1);
            phuongAn.add(map("id", id, "noiDung", meaning ? option.nghiaVi() : option.tu()));
            luaChon.add(map("id", id, "theId", option.id()));
            if (option.id().equals(card.id())) {
                answer = id;
            }
        }
        Map<String, Object> deBai = meaning
                ? map("tu", card.tu(), "phienAm", card.phienAm(), "tuLoai", card.tuLoai())
                : map("nghiaVi", card.nghiaVi(), "tuLoai", card.tuLoai());
        return new Draft(
                type,
                Long.valueOf(card.id()),
                deBai,
                phuongAn,
                map("luaChonId", answer, "noiDung", meaning ? card.nghiaVi() : card.tu(), "luaChon", luaChon),
                explain(card));
    }

    private Draft blankQuestion(StudyCardResponse card) {
        Blank blank = blankOf(card);
        if (blank == null) {
            return null;
        }
        return new Draft(
                LoaiCau.DIEN_CHO_TRONG,
                Long.valueOf(card.id()),
                map("cau", blank.cau(), "goiY", card.nghiaVi(), "tuLoai", card.tuLoai()),
                null,
                typedAnswer(blank.dapAn()),
                explain(card));
    }

    private Draft pairQuestion(StudyCardResponse target, StudyCardResponse other, Long capId) {
        Blank blank = blankOf(target);
        List<Map<String, Object>> phuongAn = new ArrayList<>();
        List<Map<String, Object>> luaChon = new ArrayList<>();
        String answer = null;
        List<StudyCardResponse> order = shuffled(List.of(target, other));
        for (int i = 0; i < order.size(); i++) {
            StudyCardResponse option = order.get(i);
            String id = "o" + (i + 1);
            phuongAn.add(map("id", id, "noiDung", option.tu()));
            luaChon.add(map("id", id, "theId", option.id()));
            if (option.id().equals(target.id())) {
                answer = id;
            }
        }
        Map<String, Object> deBai = blank == null
                ? map("cau", null, "goiY", target.nghiaVi())
                : map("cau", blank.cau(), "goiY", null);
        return new Draft(
                LoaiCau.PHAN_BIET_CAP,
                Long.valueOf(target.id()),
                deBai,
                phuongAn,
                map("luaChonId", answer,
                        "noiDung", blank == null ? target.tu() : blank.dapAn(),
                        "chapNhan", List.of(target.tu()),
                        "capId", String.valueOf(capId),
                        "luaChon", luaChon),
                map("the", explain(target), "theKhac", explain(other)));
    }

    private Draft matchQuestion(List<StudyCardResponse> group) {
        List<StudyCardResponse> left = shuffled(group);
        List<StudyCardResponse> right = shuffled(group);
        List<Map<String, Object>> cotTrai = new ArrayList<>();
        List<Map<String, Object>> cotPhai = new ArrayList<>();
        List<Map<String, Object>> cap = new ArrayList<>();
        for (int i = 0; i < left.size(); i++) {
            cotTrai.add(map("id", "t" + (i + 1), "noiDung", left.get(i).tu()));
            cotPhai.add(map("id", "n" + (i + 1), "noiDung", right.get(i).nghiaVi()));
        }
        for (int i = 0; i < left.size(); i++) {
            StudyCardResponse card = left.get(i);
            cap.add(map("traiId", "t" + (i + 1), "phaiId", "n" + (right.indexOf(card) + 1), "theId", card.id()));
        }
        return new Draft(
                LoaiCau.GHEP_TU,
                null,
                map("cotTrai", cotTrai, "cotPhai", cotPhai),
                null,
                map("cap", cap),
                group.stream().map(this::explain).toList());
    }

    private Blank blankOf(StudyCardResponse card) {
        if (card.viDuEn() == null) {
            return null;
        }
        Matcher matcher = Pattern
                .compile("(?<![A-Za-z])(" + Pattern.quote(card.tu().trim()) + "[A-Za-z]*)", Pattern.CASE_INSENSITIVE)
                .matcher(card.viDuEn());
        if (!matcher.find()) {
            return null;
        }
        String cau = card.viDuEn().substring(0, matcher.start(1)) + "_____" + card.viDuEn().substring(matcher.end(1));
        return new Blank(cau, matcher.group(1));
    }

    private List<StudyCardResponse> distinctCards(
            List<StudyCardResponse> candidates,
            List<StudyCardResponse> seed,
            int limit
    ) {
        List<StudyCardResponse> result = new ArrayList<>(seed);
        for (StudyCardResponse candidate : candidates) {
            if (result.size() >= limit) {
                break;
            }
            boolean clash = result.stream().anyMatch(card -> card.id().equals(candidate.id())
                    || normalize(card.tu()).equals(normalize(candidate.tu()))
                    || normalize(card.nghiaVi()).equals(normalize(candidate.nghiaVi())));
            if (!clash) {
                result.add(candidate);
            }
        }
        return result;
    }

    private Map<String, Object> typedAnswer(String answer) {
        return map("chapNhan", List.of(answer), "noiDung", answer);
    }

    private Map<String, Object> explain(StudyCardResponse card) {
        return map(
                "theId", card.id(),
                "tu", card.tu(),
                "phienAm", card.phienAm(),
                "tuLoai", card.tuLoai(),
                "nghiaVi", card.nghiaVi(),
                "viDuEn", card.viDuEn(),
                "dichVi", card.dichVi());
    }

    private <T> List<T> shuffled(List<T> items) {
        List<T> copy = new ArrayList<>(items);
        Collections.shuffle(copy, random);
        return copy;
    }

    private static Map<String, Object> map(Object... entries) {
        Map<String, Object> result = new LinkedHashMap<>();
        for (int i = 0; i < entries.length; i += 2) {
            result.put((String) entries[i], entries[i + 1]);
        }
        return result;
    }

    private static ApiException rule(String message) {
        return new ApiException(ErrorCode.BUSINESS_RULE, message);
    }
}
