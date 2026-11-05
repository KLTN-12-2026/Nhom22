package com.do_an_tot_nghiep.k28.practice.service;

import com.do_an_tot_nghiep.k28.practice.dto.PracticeResultItemResponse;
import com.do_an_tot_nghiep.k28.practice.dto.PracticeResultResponse;
import com.do_an_tot_nghiep.k28.practice.dto.SkillScoreResponse;
import com.do_an_tot_nghiep.k28.practice.entity.BaiLuyen;
import com.do_an_tot_nghiep.k28.practice.entity.CauHoiBaiLuyen;
import com.do_an_tot_nghiep.k28.practice.entity.LanLamBai;
import com.do_an_tot_nghiep.k28.practice.entity.TraLoiBaiLuyen;
import com.do_an_tot_nghiep.k28.practice.entity.enums.KyNang;
import com.do_an_tot_nghiep.k28.practice.entity.enums.LoaiCau;
import com.do_an_tot_nghiep.k28.practice.entity.enums.NguonBaiLuyen;
import com.do_an_tot_nghiep.k28.practice.entity.enums.NhomLoi;
import com.do_an_tot_nghiep.k28.practice.repository.BaiLuyenRepository;
import com.do_an_tot_nghiep.k28.practice.repository.CauHoiBaiLuyenRepository;
import com.do_an_tot_nghiep.k28.practice.repository.TraLoiBaiLuyenRepository;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

@Component
@RequiredArgsConstructor
class PracticeResults {

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Columns(List<PracticeGrader.Option> cotTrai, List<PracticeGrader.Option> cotPhai) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Word(String tu) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Stored(int diem, NhomLoi nhomLoi, List<Map<String, Object>> chiTiet) {
    }

    private final BaiLuyenRepository practices;
    private final CauHoiBaiLuyenRepository questions;
    private final TraLoiBaiLuyenRepository answers;
    private final JsonMapper json;

    static String deckLabel(String ten, NguonBaiLuyen nguon) {
        if (ten != null) {
            return ten;
        }
        return nguon == NguonBaiLuyen.SO_TAY ? PracticeService.SO_TAY_TEN : PracticeService.TAT_CA_BO;
    }

    String boTheTen(BaiLuyen practice) {
        String ten = practice.getBoTheId() == null
                ? null
                : practices.deckName(practice.getBoTheId()).orElse(null);
        return deckLabel(ten, practice.getNguon());
    }

    PracticeGrader.Question question(CauHoiBaiLuyen row) {
        PracticeGrader.DapAn dapAn = json.readValue(row.getDapAnJson(), PracticeGrader.DapAn.class);
        List<PracticeGrader.Option> phuongAn = row.getPhuongAnJson() == null
                ? List.of()
                : List.of(json.readValue(row.getPhuongAnJson(), PracticeGrader.Option[].class));
        Columns cot = row.getLoaiCau() == LoaiCau.GHEP_TU
                ? json.readValue(row.getDeBaiJson(), Columns.class)
                : new Columns(List.of(), List.of());
        String tuGoc = row.getLoaiCau() == LoaiCau.DIEN_CHO_TRONG
                ? json.readValue(row.getGiaiThichJson(), Word.class).tu()
                : null;
        return new PracticeGrader.Question(
                row.getLoaiCau(),
                row.getTheId(),
                tuGoc,
                phuongAn,
                cot.cotTrai(),
                cot.cotPhai(),
                dapAn);
    }

    String stored(PracticeGrader.Graded graded) {
        return json.writeValueAsString(PracticeGrader.map(
                "diem", graded.diem(),
                "nhomLoi", graded.nhomLoi(),
                "chiTiet", graded.chiTiet()));
    }

    Stored stored(TraLoiBaiLuyen answer) {
        return json.readValue(answer.getKetQuaJson(), Stored.class);
    }

    PracticeResultResponse result(BaiLuyen practice, String boTheTen, LanLamBai attempt) {
        Map<Long, TraLoiBaiLuyen> byQuestion = new HashMap<>();
        answers.findByLanLamId(attempt.getId()).forEach(answer -> byQuestion.put(answer.getCauHoiId(), answer));
        List<PracticeResultItemResponse> items = questions.findByBaiIdOrderByThuTu(practice.getId()).stream()
                .map(row -> item(row, byQuestion.get(row.getId())))
                .toList();
        return new PracticeResultResponse(
                String.valueOf(attempt.getId()),
                String.valueOf(practice.getId()),
                practice.getLoaiBai(),
                practice.getBoTheId() == null ? null : String.valueOf(practice.getBoTheId()),
                boTheTen,
                practice.isLaLuyenLai(),
                attempt.getSoCauDung(),
                attempt.getTongSoCau(),
                attempt.getDiem(),
                attempt.getThoiGian(),
                attempt.getNopAt(),
                skills(items),
                items);
    }

    private PracticeResultItemResponse item(CauHoiBaiLuyen row, TraLoiBaiLuyen answer) {
        Stored stored = stored(answer);
        PracticeGrader.DapAn dapAn = json.readValue(row.getDapAnJson(), PracticeGrader.DapAn.class);
        return new PracticeResultItemResponse(
                String.valueOf(row.getId()),
                row.getThuTu(),
                row.getLoaiCau(),
                row.getTheId() == null ? null : String.valueOf(row.getTheId()),
                json.readTree(row.getDeBaiJson()),
                row.getPhuongAnJson() == null ? null : json.readTree(row.getPhuongAnJson()),
                answer.getTraLoiJson() == null ? null : json.readTree(answer.getTraLoiJson()),
                publicAnswer(row.getLoaiCau(), dapAn),
                answer.isDung(),
                stored.diem(),
                stored.nhomLoi(),
                stored.chiTiet(),
                json.readTree(row.getGiaiThichJson()));
    }

    private static Map<String, Object> publicAnswer(LoaiCau loaiCau, PracticeGrader.DapAn dapAn) {
        return switch (loaiCau) {
            case CHON_NGHIA, CHON_TU, PHAN_BIET_CAP -> PracticeGrader.map(
                    "luaChonId", dapAn.luaChonId(),
                    "noiDung", dapAn.noiDung());
            case GHEP_TU -> PracticeGrader.map("cap", dapAn.cap().stream()
                    .map(link -> PracticeGrader.map("traiId", link.traiId(), "phaiId", link.phaiId()))
                    .toList());
            case NHAP_TU_THEO_NGHIA, NGHE_VIET, DIEN_CHO_TRONG -> PracticeGrader.map(
                    "noiDung", dapAn.noiDung(),
                    "chapNhan", dapAn.chapNhan());
        };
    }

    private static List<SkillScoreResponse> skills(List<PracticeResultItemResponse> items) {
        Map<KyNang, int[]> counts = new EnumMap<>(KyNang.class);
        for (PracticeResultItemResponse item : items) {
            int[] count = counts.computeIfAbsent(item.loaiCau().kyNang(), kyNang -> new int[2]);
            count[1]++;
            if (item.dung()) {
                count[0]++;
            }
        }
        return counts.entrySet().stream()
                .map(entry -> new SkillScoreResponse(entry.getKey(), entry.getValue()[0], entry.getValue()[1]))
                .toList();
    }
}
