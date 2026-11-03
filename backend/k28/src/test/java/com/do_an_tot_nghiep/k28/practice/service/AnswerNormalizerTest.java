package com.do_an_tot_nghiep.k28.practice.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class AnswerNormalizerTest {

    @Test
    void unifiesUnicodeFormAndCase() {
        assertThat(AnswerNormalizer.normalize("Café")).isEqualTo("café");
        assertThat(AnswerNormalizer.normalize("  ReCEIPT  ")).isEqualTo("receipt");
    }

    @Test
    void unifiesQuotesHyphensAndSpaces() {
        assertThat(AnswerNormalizer.normalize("don’t   know")).isEqualTo("don't know");
        assertThat(AnswerNormalizer.normalize("well‑known")).isEqualTo("well-known");
        assertThat(AnswerNormalizer.normalize(" look up ")).isEqualTo("look up");
    }

    @Test
    void keepsPunctuationThatChangesAnswer() {
        assertThat(AnswerNormalizer.normalize("e.g.")).isEqualTo("e.g.");
        assertThat(AnswerNormalizer.normalize("Mother-in-law")).isEqualTo("mother-in-law");
    }

    @Test
    void nullBecomesEmpty() {
        assertThat(AnswerNormalizer.normalize(null)).isEmpty();
    }
}
