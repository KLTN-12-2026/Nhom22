package com.do_an_tot_nghiep.k28.speaking.client;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.do_an_tot_nghiep.k28.speaking.dto.ChiSoPhatAm;
import com.do_an_tot_nghiep.k28.speaking.entity.enums.LoiPhatAm;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

class AzureSpeechClientTest {

    private final JsonMapper json = JsonMapper.builder().build();

    @Test
    void tc14_readsNestedAssessmentScores() {
        ChiSoPhatAm chiSo = AzureSpeechClient.parse(json.readTree("""
                {"RecognitionStatus":"Success","DisplayText":"Receipt.","NBest":[{"Display":"Receipt.",
                "PronunciationAssessment":{"AccuracyScore":88.5,"FluencyScore":91,"CompletenessScore":100,"PronScore":90.2},
                "Words":[{"Word":"receipt","PronunciationAssessment":{"AccuracyScore":88.5,"ErrorType":"Mispronunciation"}}]}]}
                """));
        assertThat(chiSo.tongDiem()).isEqualTo(90.2);
        assertThat(chiSo.doChinhXac()).isEqualTo(88.5);
        assertThat(chiSo.doTroiChay()).isEqualTo(91.0);
        assertThat(chiSo.doDayDu()).isEqualTo(100.0);
        assertThat(chiSo.vanBanNhanDien()).isEqualTo("Receipt.");
        assertThat(chiSo.tu()).singleElement().satisfies(tu -> {
            assertThat(tu.tu()).isEqualTo("receipt");
            assertThat(tu.loi()).isEqualTo(LoiPhatAm.SAI);
        });
    }

    @Test
    void tc14_missingOrInvalidScoresStayNull() {
        ChiSoPhatAm chiSo = AzureSpeechClient.parse(json.readTree("""
                {"RecognitionStatus":"Success","NBest":[{"Display":"hi","AccuracyScore":75,"FluencyScore":"high",
                "PronScore":140,"Words":[{"Word":"hi","AccuracyScore":75,"ErrorType":"None"}]}]}
                """));
        assertThat(chiSo.doChinhXac()).isEqualTo(75.0);
        assertThat(chiSo.doTroiChay()).isNull();
        assertThat(chiSo.tongDiem()).isNull();
        assertThat(chiSo.doDayDu()).isNull();
        assertThat(chiSo.hasAllScores()).isFalse();
        assertThat(chiSo.tu().getFirst().loi()).isEqualTo(LoiPhatAm.KHONG);
    }

    @Test
    void tc14_noSpeechHasNoScoresAndErrorsAreRejected() {
        assertThat(AzureSpeechClient.parse(json.readTree("{\"RecognitionStatus\":\"NoMatch\"}")).hasNoScore())
                .isTrue();
        assertThatThrownBy(() -> AzureSpeechClient.parse(json.readTree("{\"RecognitionStatus\":\"Error\"}")))
                .isInstanceOf(SpeechException.class);
        assertThatThrownBy(() -> AzureSpeechClient.parse(json.readTree("[]")))
                .isInstanceOf(SpeechException.class);
    }
}
