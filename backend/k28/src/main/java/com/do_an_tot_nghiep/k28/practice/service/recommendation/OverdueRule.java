package com.do_an_tot_nghiep.k28.practice.service.recommendation;

import com.do_an_tot_nghiep.k28.learning.service.LearningPlanService;
import com.do_an_tot_nghiep.k28.practice.dto.RecommendationEvidenceResponse;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class OverdueRule implements RecommendationRule {

    private final LearningPlanService learningPlanService;
    private final RecommendationProperties properties;

    @Override
    public MaLyDoGoiY code() {
        return MaLyDoGoiY.QUA_HAN_NHIEU;
    }

    @Override
    public List<RecommendationCandidate> evaluate(Long userId, Instant now) {
        return learningPlanService.overdue(userId, properties.toiDaTheQuaHan())
                .map(summary -> List.of(new RecommendationCandidate(
                        code(),
                        "Bạn có %d lượt ôn quá hạn, nhiều hơn %d lượt mỗi ngày với %d phút học. Chia kế hoạch cứu lịch trong %d ngày"
                                .formatted(summary.soQuaHan(), summary.luotMoiNgay(), summary.phutMoiNgay(),
                                        summary.soNgayKeHoach()),
                        summary.theIds(),
                        RecommendationEvidenceResponse.builder()
                                .soQuaHan(summary.soQuaHan())
                                .soDenHan(summary.soDenHan())
                                .luotMoiNgay(summary.luotMoiNgay())
                                .phutMoiNgay(summary.phutMoiNgay())
                                .soNgayKeHoach(summary.soNgayKeHoach())
                                .build(),
                        false)))
                .orElse(List.of());
    }
}
