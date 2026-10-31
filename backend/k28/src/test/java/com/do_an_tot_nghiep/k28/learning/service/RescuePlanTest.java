package com.do_an_tot_nghiep.k28.learning.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.do_an_tot_nghiep.k28.learning.dto.CuuLichOnResponse;
import com.do_an_tot_nghiep.k28.learning.dto.KeHoachNgayResponse;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class RescuePlanTest {

    private static final LocalDate TODAY = LocalDate.parse("2026-10-19");

    @Test
    void tc10_planListsAtMostFourteenDaysButKeepsRealDayCount() {
        CuuLichOnResponse plan = LearningPlanService.rescuePlan(TODAY, 90, 10, 1, false);

        assertThat(plan.soTheCanOn()).isEqualTo(100);
        assertThat(plan.luotMoiNgay()).isEqualTo(3);
        assertThat(plan.soNgay()).isEqualTo(34);
        assertThat(plan.keHoach()).hasSize(14);
        assertThat(plan.keHoach().getFirst().ngay()).isEqualTo(TODAY);
        assertThat(plan.keHoach().getLast().ngay()).isEqualTo(TODAY.plusDays(13));
        assertThat(plan.keHoach()).extracting(KeHoachNgayResponse::soThe).containsOnly(3);
        assertThat(plan.tamDungTuMoi()).isTrue();
    }

    @Test
    void tc10_lastDayTakesRemainderAndMinutesRoundUp() {
        CuuLichOnResponse plan = LearningPlanService.rescuePlan(TODAY, 40, 5, 10, true);

        assertThat(plan.luotMoiNgay()).isEqualTo(30);
        assertThat(plan.soNgay()).isEqualTo(2);
        assertThat(plan.keHoach()).extracting(KeHoachNgayResponse::soThe).containsExactly(30, 15);
        assertThat(plan.keHoach()).extracting(KeHoachNgayResponse::phut).containsExactly(10, 5);
        assertThat(plan.keHoach().stream().mapToInt(KeHoachNgayResponse::soThe).sum()).isEqualTo(45);
        assertThat(plan.tamDungTuMoi()).isFalse();
    }

    @Test
    void tc10_exactMultipleHasNoEmptyTrailingDay() {
        CuuLichOnResponse plan = LearningPlanService.rescuePlan(TODAY, 12, 0, 2, false);

        assertThat(plan.luotMoiNgay()).isEqualTo(6);
        assertThat(plan.soNgay()).isEqualTo(2);
        assertThat(plan.keHoach()).extracting(KeHoachNgayResponse::soThe).containsExactly(6, 6);
        assertThat(plan.keHoach()).extracting(KeHoachNgayResponse::phut).containsExactly(2, 2);
    }
}
