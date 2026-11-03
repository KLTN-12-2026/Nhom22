package com.do_an_tot_nghiep.k28.practice.service;

import com.do_an_tot_nghiep.k28.practice.entity.enums.LoaiCau;
import com.do_an_tot_nghiep.k28.practice.entity.enums.NhomLoi;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

final class PracticeGrader {

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Option(String id, String noiDung) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Choice(String id, String theId) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Link(String traiId, String phaiId, String theId) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record DapAn(
            String luaChonId,
            String noiDung,
            List<String> chapNhan,
            String capId,
            List<Choice> luaChon,
            List<Link> cap
    ) {
    }

    record Question(
            LoaiCau loaiCau,
            Long theId,
            String tuGoc,
            List<Option> phuongAn,
            List<Option> cotTrai,
            List<Option> cotPhai,
            DapAn dapAn
    ) {
    }

    record Answer(String luaChonId, String noiDung, Map<String, String> cap) {

        static final Answer TRONG = new Answer(null, null, Map.of());

        Answer {
            cap = cap == null ? Map.of() : cap;
        }
    }

    record Mistake(Long theId, NhomLoi nhomLoi, String traLoi, String dapAn, Long theNhamId) {
    }

    record Confusion(Long theId, Long theNhamId) {
    }

    record Graded(
            boolean dung,
            double ty,
            NhomLoi nhomLoi,
            Map<String, Object> traLoi,
            List<Map<String, Object>> chiTiet,
            List<Mistake> loi,
            List<Confusion> nham
    ) {

        int diem() {
            return (int) Math.round(ty * 100);
        }
    }

    private PracticeGrader() {
    }

    static Graded grade(Question question, Answer answer) {
        Answer given = answer == null ? Answer.TRONG : answer;
        return switch (question.loaiCau()) {
            case CHON_NGHIA, CHON_TU, PHAN_BIET_CAP -> choice(question, given.luaChonId());
            case NHAP_TU_THEO_NGHIA, NGHE_VIET, DIEN_CHO_TRONG -> typed(question, given.noiDung());
            case GHEP_TU -> match(question, given.cap());
        };
    }

    static int score(List<Graded> results) {
        if (results.isEmpty()) {
            return 0;
        }
        double tong = results.stream().mapToDouble(Graded::ty).sum();
        return (int) Math.round(tong / results.size() * 100);
    }

    static int threshold(int length) {
        return length <= 4 ? 1 : length <= 8 ? 2 : 3;
    }

    static int distance(String a, String b) {
        int[][] d = new int[a.length() + 1][b.length() + 1];
        for (int i = 0; i <= a.length(); i++) {
            d[i][0] = i;
        }
        for (int j = 0; j <= b.length(); j++) {
            d[0][j] = j;
        }
        for (int i = 1; i <= a.length(); i++) {
            for (int j = 1; j <= b.length(); j++) {
                int cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                d[i][j] = Math.min(Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1), d[i - 1][j - 1] + cost);
                if (i > 1 && j > 1 && a.charAt(i - 1) == b.charAt(j - 2) && a.charAt(i - 2) == b.charAt(j - 1)) {
                    d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
                }
            }
        }
        return d[a.length()][b.length()];
    }

    private static Graded choice(Question question, String luaChonId) {
        NhomLoi nhomLoi = question.loaiCau() == LoaiCau.PHAN_BIET_CAP ? NhomLoi.CAP_NHAM : NhomLoi.NGHIA;
        if (luaChonId == null) {
            return wrong(question, nhomLoi, null, null, null);
        }
        String noiDung = text(question.phuongAn(), luaChonId);
        Map<String, Object> traLoi = map("luaChonId", luaChonId, "noiDung", noiDung);
        if (luaChonId.equals(question.dapAn().luaChonId())) {
            return right(traLoi);
        }
        Long theNhamId = question.dapAn().luaChon().stream()
                .filter(option -> option.id().equals(luaChonId))
                .map(option -> Long.valueOf(option.theId()))
                .findFirst()
                .orElse(null);
        return wrong(question, nhomLoi, traLoi, noiDung, theNhamId);
    }

    private static Graded typed(Question question, String noiDung) {
        NhomLoi nhomLoi = switch (question.loaiCau()) {
            case NGHE_VIET -> NhomLoi.NGHE;
            case DIEN_CHO_TRONG -> NhomLoi.NGU_CANH;
            default -> NhomLoi.NGHIA;
        };
        String got = AnswerNormalizer.normalize(noiDung);
        if (got.isEmpty()) {
            return wrong(question, nhomLoi, null, null, null);
        }
        Map<String, Object> traLoi = map("noiDung", noiDung.strip());
        List<String> accepted = question.dapAn().chapNhan().stream().map(AnswerNormalizer::normalize).toList();
        if (accepted.contains(got)) {
            return right(traLoi);
        }
        boolean dangGoc = question.loaiCau() == LoaiCau.DIEN_CHO_TRONG
                && got.equals(AnswerNormalizer.normalize(question.tuGoc()));
        if (!dangGoc && near(got, accepted)) {
            nhomLoi = NhomLoi.CHINH_TA;
        }
        return wrong(question, nhomLoi, traLoi, noiDung.strip(), null);
    }

    private static Graded match(Question question, Map<String, String> chosen) {
        Map<String, String> tu = texts(question.cotTrai());
        Map<String, String> nghia = texts(question.cotPhai());
        Map<String, Long> theTheoPhai = new HashMap<>();
        question.dapAn().cap().forEach(link -> theTheoPhai.put(link.phaiId(), Long.valueOf(link.theId())));
        List<Map<String, Object>> chiTiet = new ArrayList<>();
        List<Mistake> loi = new ArrayList<>();
        List<Confusion> nham = new ArrayList<>();
        int soCapDung = 0;
        for (Link link : question.dapAn().cap()) {
            String daChon = chosen.get(link.traiId());
            boolean ok = link.phaiId().equals(daChon);
            String nghiaDaChon = daChon == null ? null : nghia.get(daChon);
            String nghiaDung = nghia.get(link.phaiId());
            chiTiet.add(map(
                    "traiId", link.traiId(),
                    "tu", tu.get(link.traiId()),
                    "phaiIdDaChon", daChon,
                    "nghiaDaChon", nghiaDaChon,
                    "phaiId", link.phaiId(),
                    "nghiaDung", nghiaDung,
                    "dung", ok));
            if (ok) {
                soCapDung++;
                continue;
            }
            Long theId = Long.valueOf(link.theId());
            Long theNhamId = daChon == null ? null : theTheoPhai.get(daChon);
            loi.add(new Mistake(theId, NhomLoi.NGHIA, nghiaDaChon, nghiaDung, theNhamId));
            if (theNhamId != null) {
                nham.add(new Confusion(theId, theNhamId));
            }
        }
        Map<String, Object> traLoi = chosen.isEmpty()
                ? null
                : map("cap", chosen.entrySet().stream()
                        .map(entry -> map("traiId", entry.getKey(), "phaiId", entry.getValue()))
                        .toList());
        int tong = question.dapAn().cap().size();
        boolean dungHet = soCapDung == tong;
        return new Graded(
                dungHet,
                (double) soCapDung / tong,
                dungHet ? null : NhomLoi.NGHIA,
                traLoi,
                chiTiet,
                loi,
                nham);
    }

    private static Graded right(Map<String, Object> traLoi) {
        return new Graded(true, 1, null, traLoi, null, List.of(), List.of());
    }

    private static Graded wrong(
            Question question,
            NhomLoi nhomLoi,
            Map<String, Object> traLoi,
            String traLoiText,
            Long theNhamId
    ) {
        List<Confusion> nham = theNhamId == null || theNhamId.equals(question.theId())
                ? List.of()
                : List.of(new Confusion(question.theId(), theNhamId));
        return new Graded(
                false,
                0,
                nhomLoi,
                traLoi,
                null,
                List.of(new Mistake(question.theId(), nhomLoi, traLoiText, question.dapAn().noiDung(), theNhamId)),
                nham);
    }

    private static boolean near(String got, List<String> accepted) {
        return accepted.stream().anyMatch(target -> distance(got, target) <= threshold(target.length()));
    }

    private static String text(List<Option> options, String id) {
        return options.stream()
                .filter(option -> option.id().equals(id))
                .map(Option::noiDung)
                .findFirst()
                .orElse(null);
    }

    private static Map<String, String> texts(List<Option> options) {
        Map<String, String> result = new HashMap<>();
        options.forEach(option -> result.put(option.id(), option.noiDung()));
        return result;
    }

    static Map<String, Object> map(Object... entries) {
        Map<String, Object> result = new LinkedHashMap<>();
        for (int i = 0; i < entries.length; i += 2) {
            result.put((String) entries[i], entries[i + 1]);
        }
        return result;
    }
}
