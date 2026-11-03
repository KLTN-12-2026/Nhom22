package com.do_an_tot_nghiep.k28.stats.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.Test;

class MasteryCalculatorTest {

    @Test
    void weightedFavoursRecentAnswers() {
        assertThat(MasteryCalculator.weighted(List.of(true, true, true, false, false, false), 20)).isEqualTo(54);
        assertThat(MasteryCalculator.weighted(List.of(false, false, false, true, true, true), 20)).isEqualTo(46);
        assertThat(MasteryCalculator.weighted(List.of(true, true, true, true, true), 20)).isEqualTo(100);
    }

    @Test
    void weightedIgnoresAnswersBeyondWindowAndEmptyIsNull() {
        List<Boolean> answers = new ArrayList<>(Collections.nCopies(20, true));
        answers.addAll(Collections.nCopies(5, false));
        assertThat(MasteryCalculator.weighted(answers, 20)).isEqualTo(100);
        assertThat(MasteryCalculator.weighted(List.of(), 20)).isNull();
    }

    @Test
    void percentRoundsHalfUpAndNullWithoutData() {
        assertThat(MasteryCalculator.percent(1, 8)).isEqualTo(13);
        assertThat(MasteryCalculator.percent(1, 3)).isEqualTo(33);
        assertThat(MasteryCalculator.percent(2, 3)).isEqualTo(67);
        assertThat(MasteryCalculator.percent(0, 4)).isZero();
        assertThat(MasteryCalculator.percent(0, 0)).isNull();
    }
}
