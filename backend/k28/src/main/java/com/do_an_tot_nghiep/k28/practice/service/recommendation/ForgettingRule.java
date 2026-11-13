package com.do_an_tot_nghiep.k28.practice.service.recommendation;

import com.do_an_tot_nghiep.k28.learning.entity.enums.DanhGia;
import com.do_an_tot_nghiep.k28.learning.entity.enums.TrangThaiTienDo;
import com.do_an_tot_nghiep.k28.practice.dto.RecommendationEvidenceResponse;
import com.do_an_tot_nghiep.k28.practice.repository.LapseStatRow;
import com.do_an_tot_nghiep.k28.practice.repository.NotebookCardRow;
import com.do_an_tot_nghiep.k28.practice.repository.SoTayTuKhoRepository;
import com.do_an_tot_nghiep.k28.practice.service.NotebookProperties;
import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ForgettingRule implements RecommendationRule {

    private final SoTayTuKhoRepository notebook;
    private final RecommendationCards cards;
    private final NotebookProperties properties;

    @Override
    public MaLyDoGoiY code() {
        return MaLyDoGoiY.QUEN_NHIEU;
    }

    @Override
    public List<RecommendationCandidate> evaluate(Long userId, Instant now) {
        Instant since = now.minus(Duration.ofDays(properties.quenNhieuNgay()));
        List<LapseStatRow> rows = notebook
                .lapseStats(userId, since, DanhGia.QUEN, TrangThaiTienDo.ON_TAP.name())
                .stream()
                .filter(row -> row.soLan() >= properties.quenNhieu())
                .sorted(Comparator.comparing(LapseStatRow::soLan, Comparator.reverseOrder())
                        .thenComparing(LapseStatRow::lanCuoiAt, Comparator.reverseOrder())
                        .thenComparing(LapseStatRow::theId, Comparator.reverseOrder()))
                .toList();
        Map<Long, NotebookCardRow> usable = cards.usable(userId, rows.stream().map(LapseStatRow::theId).toList());
        return rows.stream()
                .filter(row -> usable.containsKey(row.theId()))
                .map(row -> new RecommendationCandidate(
                        code(),
                        "Ôn lại ‘%s’ và thêm mẹo nhớ: bạn quên %d lần trong %d ngày qua".formatted(
                                usable.get(row.theId()).tu(), row.soLan(), properties.quenNhieuNgay()),
                        List.of(row.theId()),
                        RecommendationEvidenceResponse.builder()
                                .soLanQuen(row.soLan().intValue())
                                .soNgay(properties.quenNhieuNgay())
                                .lanCuoiAt(row.lanCuoiAt())
                                .build(),
                        true))
                .toList();
    }
}
