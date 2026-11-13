package com.do_an_tot_nghiep.k28.practice.service.recommendation;

import com.do_an_tot_nghiep.k28.practice.dto.RecommendationEvidenceResponse;
import com.do_an_tot_nghiep.k28.practice.repository.NotebookCardRow;
import com.do_an_tot_nghiep.k28.practice.repository.SoTayTuKhoRepository;
import com.do_an_tot_nghiep.k28.practice.repository.SoTayTuKhoRepository.ProgressStatRow;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ProgressRule implements RecommendationRule {

    private final SoTayTuKhoRepository notebook;
    private final RecommendationCards cards;
    private final RecommendationProperties properties;

    @Override
    public MaLyDoGoiY code() {
        return MaLyDoGoiY.TIEN_BO;
    }

    @Override
    public List<RecommendationCandidate> evaluate(Long userId, Instant now) {
        ProgressPolicy policy = new ProgressPolicy(properties.tienBo());
        List<ProgressStatRow> rows = notebook.progressStats(userId, policy.oldFrom(now), policy.recentFrom(now))
                .stream()
                .filter(row -> policy.matches(row.getSoLuotCu(), row.getSoSaiCu(), row.getSoLuotMoi(), row.getSoSaiMoi()))
                .toList();
        Map<Long, NotebookCardRow> usable = cards.usable(userId, rows.stream().map(ProgressStatRow::getTheId).toList());
        int soNgayMoi = properties.tienBo().soNgayMoi();
        return rows.stream()
                .filter(row -> usable.containsKey(row.getTheId()))
                .map(row -> {
                    long soDungMoi = row.getSoLuotMoi() - row.getSoSaiMoi();
                    return new RecommendationCandidate(
                            code(),
                            "‘%s’: sai %d/%d lượt trước đó, đúng %d/%d lượt trong %d ngày gần đây".formatted(
                                    usable.get(row.getTheId()).tu(), row.getSoSaiCu(), row.getSoLuotCu(),
                                    soDungMoi, row.getSoLuotMoi(), soNgayMoi),
                            List.of(row.getTheId()),
                            RecommendationEvidenceResponse.builder()
                                    .soLuotCu(row.getSoLuotCu().intValue())
                                    .soSaiCu(row.getSoSaiCu().intValue())
                                    .soNgayCu(properties.tienBo().soNgayCu() - soNgayMoi)
                                    .soLuotMoi(row.getSoLuotMoi().intValue())
                                    .soDungMoi((int) soDungMoi)
                                    .soNgayMoi(soNgayMoi)
                                    .lanCuoiAt(row.getLanCuoiAt())
                                    .build(),
                            true);
                })
                .toList();
    }
}
