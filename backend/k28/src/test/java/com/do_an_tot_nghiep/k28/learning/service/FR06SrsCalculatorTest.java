package com.do_an_tot_nghiep.k28.learning.service;

import com.do_an_tot_nghiep.k28.learning.entity.enums.DanhGia;
import com.do_an_tot_nghiep.k28.learning.entity.enums.TrangThaiTienDo;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FR06SrsCalculatorTest {

    private static final Instant NOW = Instant.parse("2026-10-13T13:00:00Z");

    private final SrsCalculator calculator = new SrsCalculator();

    private SrsState onTap(int interval, String ef, int streak) {
        return new SrsState(
                TrangThaiTienDo.ON_TAP, 0, new BigDecimal(ef), interval, streak, 0, NOW);
    }

    private SrsState learningState(String status, int step) {
        if (status.equals("MOI")) {
            return SrsState.newCard();
        }
        return new SrsState(TrangThaiTienDo.DANG_HOC, step, SrsState.INITIAL_EF, 0, 0, 0, NOW);
    }

    private SrsState relearning(String ef, int lapses) {
        return new SrsState(TrangThaiTienDo.HOC_LAI, 0, new BigDecimal(ef), 0, 0, lapses, NOW);
    }

    @Test
    void tc06_nhoChainGivesTenMinutesOneSixFifteenDays() {
        SrsState s1 = calculator.calculate(SrsState.newCard(), DanhGia.NHO, NOW);
        assertThat(s1.trangThai()).isEqualTo(TrangThaiTienDo.DANG_HOC);
        assertThat(s1.buocHoc()).isEqualTo(1);
        assertThat(s1.hanOnAt()).isEqualTo(NOW.plus(Duration.ofMinutes(10)));

        Instant t2 = s1.hanOnAt();
        SrsState s2 = calculator.calculate(s1, DanhGia.NHO, t2);
        assertThat(s2.trangThai()).isEqualTo(TrangThaiTienDo.ON_TAP);
        assertThat(s2.khoangOnNgay()).isEqualTo(1);
        assertThat(s2.chuoiThanhCong()).isEqualTo(1);
        assertThat(s2.hanOnAt()).isEqualTo(t2.plus(1, ChronoUnit.DAYS));

        Instant t3 = s2.hanOnAt();
        SrsState s3 = calculator.calculate(s2, DanhGia.NHO, t3);
        assertThat(s3.khoangOnNgay()).isEqualTo(6);
        assertThat(s3.chuoiThanhCong()).isEqualTo(2);
        assertThat(s3.hanOnAt()).isEqualTo(t3.plus(6, ChronoUnit.DAYS));

        Instant t4 = s3.hanOnAt();
        SrsState s4 = calculator.calculate(s3, DanhGia.NHO, t4);
        assertThat(s4.khoangOnNgay()).isEqualTo(15);
        assertThat(s4.chuoiThanhCong()).isEqualTo(3);
        assertThat(s4.ef()).isEqualByComparingTo("2.50");
        assertThat(s4.hanOnAt()).isEqualTo(t4.plus(15, ChronoUnit.DAYS));

        SrsState s5 = calculator.calculate(s4, DanhGia.NHO, s4.hanOnAt());
        assertThat(s5.khoangOnNgay()).isEqualTo(38);
    }

    @ParameterizedTest
    @CsvSource({
            "KHO,2.36,7,3",
            "NHO,2.50,15,3",
            "DE,2.60,20,3"
    })
    void tc06_onTapFromSixDaysEfTwoPointFive(String rating, String ef, int days, int streak) {
        SrsState result = calculator.calculate(onTap(6, "2.50", 2), DanhGia.valueOf(rating), NOW);

        assertThat(result.trangThai()).isEqualTo(TrangThaiTienDo.ON_TAP);
        assertThat(result.ef()).isEqualByComparingTo(ef);
        assertThat(result.khoangOnNgay()).isEqualTo(days);
        assertThat(result.chuoiThanhCong()).isEqualTo(streak);
        assertThat(result.hanOnAt()).isEqualTo(NOW.plus(days, ChronoUnit.DAYS));
    }

    @Test
    void tc07_quenAtOnTapGoesToRelearning() {
        SrsState result = calculator.calculate(onTap(6, "2.50", 2), DanhGia.QUEN, NOW);

        assertThat(result.trangThai()).isEqualTo(TrangThaiTienDo.HOC_LAI);
        assertThat(result.ef()).isEqualByComparingTo("1.96");
        assertThat(result.soLanQuen()).isEqualTo(1);
        assertThat(result.chuoiThanhCong()).isZero();
        assertThat(result.khoangOnNgay()).isZero();
        assertThat(result.hanOnAt()).isEqualTo(NOW.plus(Duration.ofMinutes(10)));
    }

    @Test
    void tc07_relearningPathKeepsEfAndCountsOneLapse() {
        SrsState lapsed = calculator.calculate(onTap(6, "2.50", 2), DanhGia.QUEN, NOW);

        SrsState hard1 = calculator.calculate(lapsed, DanhGia.KHO, NOW);
        SrsState hard2 = calculator.calculate(hard1, DanhGia.KHO, NOW);
        assertThat(hard2.trangThai()).isEqualTo(TrangThaiTienDo.HOC_LAI);
        assertThat(hard2.ef()).isEqualByComparingTo("1.96");
        assertThat(hard2.soLanQuen()).isEqualTo(1);
        assertThat(hard2.hanOnAt()).isEqualTo(NOW.plus(Duration.ofMinutes(10)));

        SrsState back = calculator.calculate(hard2, DanhGia.NHO, NOW);
        assertThat(back.trangThai()).isEqualTo(TrangThaiTienDo.ON_TAP);
        assertThat(back.khoangOnNgay()).isEqualTo(1);
        assertThat(back.chuoiThanhCong()).isEqualTo(1);

        SrsState sixDays = calculator.calculate(back, DanhGia.NHO, NOW);
        assertThat(sixDays.khoangOnNgay()).isEqualTo(6);

        SrsState twelveDays = calculator.calculate(sixDays, DanhGia.NHO, NOW);
        assertThat(twelveDays.khoangOnNgay()).isEqualTo(12);
        assertThat(twelveDays.ef()).isEqualByComparingTo("1.96");
    }

    @ParameterizedTest
    @CsvSource({
            "MOI,0,QUEN,0,1",
            "MOI,0,KHO,0,5",
            "MOI,0,NHO,1,10",
            "DANG_HOC,0,QUEN,0,1",
            "DANG_HOC,0,KHO,0,5",
            "DANG_HOC,0,NHO,1,10",
            "DANG_HOC,1,QUEN,0,1",
            "DANG_HOC,1,KHO,1,10"
    })
    void learningStepsUseMinutes(String status, int step, String rating, int nextStep, int minutes) {
        SrsState result = calculator.calculate(learningState(status, step), DanhGia.valueOf(rating), NOW);

        assertThat(result.trangThai()).isEqualTo(TrangThaiTienDo.DANG_HOC);
        assertThat(result.buocHoc()).isEqualTo(nextStep);
        assertThat(result.ef()).isEqualByComparingTo("2.50");
        assertThat(result.hanOnAt()).isEqualTo(NOW.plus(Duration.ofMinutes(minutes)));
    }

    @ParameterizedTest
    @CsvSource({
            "MOI,0,DE,4",
            "DANG_HOC,0,DE,4",
            "DANG_HOC,1,NHO,1",
            "DANG_HOC,1,DE,4"
    })
    void learningGraduatesToOnTap(String status, int step, String rating, int days) {
        SrsState result = calculator.calculate(learningState(status, step), DanhGia.valueOf(rating), NOW);

        assertThat(result.trangThai()).isEqualTo(TrangThaiTienDo.ON_TAP);
        assertThat(result.khoangOnNgay()).isEqualTo(days);
        assertThat(result.chuoiThanhCong()).isEqualTo(1);
        assertThat(result.hanOnAt()).isEqualTo(NOW.plus(days, ChronoUnit.DAYS));
    }

    @ParameterizedTest
    @CsvSource({
            "QUEN,1",
            "KHO,10"
    })
    void relearningStaysInRelearning(String rating, int minutes) {
        SrsState result = calculator.calculate(relearning("1.96", 1), DanhGia.valueOf(rating), NOW);

        assertThat(result.trangThai()).isEqualTo(TrangThaiTienDo.HOC_LAI);
        assertThat(result.soLanQuen()).isEqualTo(1);
        assertThat(result.hanOnAt()).isEqualTo(NOW.plus(Duration.ofMinutes(minutes)));
    }

    @ParameterizedTest
    @CsvSource({
            "NHO,1",
            "DE,2"
    })
    void relearningGraduatesBackToOnTap(String rating, int days) {
        SrsState result = calculator.calculate(relearning("1.96", 1), DanhGia.valueOf(rating), NOW);

        assertThat(result.trangThai()).isEqualTo(TrangThaiTienDo.ON_TAP);
        assertThat(result.khoangOnNgay()).isEqualTo(days);
        assertThat(result.chuoiThanhCong()).isEqualTo(1);
        assertThat(result.ef()).isEqualByComparingTo("1.96");
    }

    @Test
    void efNeverDropsBelowFloor() {
        SrsState result = calculator.calculate(onTap(6, "1.50", 2), DanhGia.QUEN, NOW);

        assertThat(result.ef()).isEqualByComparingTo("1.30");
    }

    @Test
    void intervalIsCappedAtOneYear() {
        SrsState result = calculator.calculate(onTap(300, "2.50", 3), DanhGia.DE, NOW);

        assertThat(result.khoangOnNgay()).isEqualTo(365);
        assertThat(result.hanOnAt()).isEqualTo(NOW.plus(365, ChronoUnit.DAYS));
    }

    @Test
    void intervalAtCapStillGrowsChain() {
        SrsState result = calculator.calculate(onTap(365, "2.50", 5), DanhGia.NHO, NOW);

        assertThat(result.khoangOnNgay()).isEqualTo(365);
        assertThat(result.chuoiThanhCong()).isEqualTo(6);
    }

    @Test
    void khoSmallIntervalGrowsByAtLeastOneDay() {
        SrsState result = calculator.calculate(onTap(1, "2.50", 1), DanhGia.KHO, NOW);

        assertThat(result.khoangOnNgay()).isEqualTo(2);
    }

    @Test
    void suspendedCardAndNullInputsAreRejected() {
        SrsState suspended = new SrsState(
                TrangThaiTienDo.TAM_NGUNG, 0, SrsState.INITIAL_EF, 0, 0, 0, null);

        assertThatThrownBy(() -> calculator.calculate(suspended, DanhGia.NHO, NOW))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> calculator.calculate(null, DanhGia.NHO, NOW))
                .isInstanceOf(NullPointerException.class);
        assertThatThrownBy(() -> calculator.calculate(SrsState.newCard(), null, NOW))
                .isInstanceOf(NullPointerException.class);
        assertThatThrownBy(() -> calculator.calculate(SrsState.newCard(), DanhGia.NHO, null))
                .isInstanceOf(NullPointerException.class);
    }

    @Test
    void invalidStatesCannotBeBuilt() {
        assertThatThrownBy(() -> new SrsState(
                TrangThaiTienDo.ON_TAP, 0, new BigDecimal("1.20"), 3, 1, 0, NOW))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new SrsState(
                TrangThaiTienDo.MOI, 0, SrsState.INITIAL_EF, 0, 0, 0, NOW))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new SrsState(
                TrangThaiTienDo.ON_TAP, 0, new BigDecimal("2.555"), 3, 1, 0, NOW))
                .isInstanceOf(IllegalArgumentException.class);
    }
}