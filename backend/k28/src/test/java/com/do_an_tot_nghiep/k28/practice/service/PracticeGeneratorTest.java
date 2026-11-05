package com.do_an_tot_nghiep.k28.practice.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.content.dto.StudyCardResponse;
import com.do_an_tot_nghiep.k28.practice.entity.enums.LoaiBai;
import java.util.List;
import java.util.Random;
import org.junit.jupiter.api.Test;

class PracticeGeneratorTest {

    private final PracticeGenerator generator = new PracticeGenerator(new Random(7));

    @Test
    void tc11_blankHidesEveryOccurrenceOfTheWord() {
        StudyCardResponse card = card("1", "art", "Art lovers buy art at the art fair.");

        PracticeGenerator.Draft draft = generator.generate(
                LoaiBai.DIEN_CHO_TRONG, 5, List.of(card), List.of(card), List.of()).getFirst();

        assertThat((String) draft.deBai().get("cau")).isEqualTo("_____ lovers buy _____ at the _____ fair.");
        assertThat(draft.dapAn().get("noiDung")).isEqualTo("Art");
    }

    @Test
    void tc11_blankAcceptsInflectionButNotOtherWordsWithSamePrefix() {
        StudyCardResponse plural = card("1", "art", "This article is about modern arts.");

        PracticeGenerator.Draft draft = generator.generate(
                LoaiBai.DIEN_CHO_TRONG, 5, List.of(plural), List.of(plural), List.of()).getFirst();

        assertThat((String) draft.deBai().get("cau")).isEqualTo("This article is about modern _____.");
        assertThat(draft.dapAn().get("noiDung")).isEqualTo("arts");
    }

    @Test
    void tc11_prefixOfAnotherWordIsNotABlank() {
        StudyCardResponse card = card("1", "art", "This article is long.");

        assertThatThrownBy(() -> generator.generate(
                LoaiBai.DIEN_CHO_TRONG, 5, List.of(card), List.of(card), List.of()))
                .isInstanceOf(ApiException.class);
    }

    private StudyCardResponse card(String id, String tu, String viDuEn) {
        return new StudyCardResponse(id, "10", tu, "noun", null, "nghệ thuật", viDuEn, null,
                null, null, null, 0L);
    }
}
