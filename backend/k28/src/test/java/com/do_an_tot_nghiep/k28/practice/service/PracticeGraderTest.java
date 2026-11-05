package com.do_an_tot_nghiep.k28.practice.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.do_an_tot_nghiep.k28.practice.entity.enums.LoaiCau;
import com.do_an_tot_nghiep.k28.practice.entity.enums.NhomLoi;
import com.do_an_tot_nghiep.k28.practice.service.PracticeGrader.Answer;
import com.do_an_tot_nghiep.k28.practice.service.PracticeGrader.Choice;
import com.do_an_tot_nghiep.k28.practice.service.PracticeGrader.Confusion;
import com.do_an_tot_nghiep.k28.practice.service.PracticeGrader.DapAn;
import com.do_an_tot_nghiep.k28.practice.service.PracticeGrader.Graded;
import com.do_an_tot_nghiep.k28.practice.service.PracticeGrader.Link;
import com.do_an_tot_nghiep.k28.practice.service.PracticeGrader.Mistake;
import com.do_an_tot_nghiep.k28.practice.service.PracticeGrader.Option;
import com.do_an_tot_nghiep.k28.practice.service.PracticeGrader.Question;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class PracticeGraderTest {

    @Test
    void choiceCorrectHasNoMistake() {
        Graded graded = PracticeGrader.grade(choice(LoaiCau.CHON_NGHIA), new Answer("o2", null, null));

        assertThat(graded.dung()).isTrue();
        assertThat(graded.diem()).isEqualTo(100);
        assertThat(graded.nhomLoi()).isNull();
        assertThat(graded.loi()).isEmpty();
        assertThat(graded.nham()).isEmpty();
    }

    @Test
    void choiceWrongRecordsMeaningAndConfusion() {
        Graded graded = PracticeGrader.grade(choice(LoaiCau.CHON_NGHIA), new Answer("o1", null, null));

        assertThat(graded.dung()).isFalse();
        assertThat(graded.nhomLoi()).isEqualTo(NhomLoi.NGHIA);
        assertThat(graded.traLoi()).containsEntry("luaChonId", "o1").containsEntry("noiDung", "biên lai");
        assertThat(graded.loi()).containsExactly(new Mistake(10L, NhomLoi.NGHIA, "biên lai", "hóa đơn", 20L));
        assertThat(graded.nham()).containsExactly(new Confusion(10L, 20L));
    }

    @Test
    void pairQuestionWrongIsConfusedPair() {
        Graded graded = PracticeGrader.grade(choice(LoaiCau.PHAN_BIET_CAP), new Answer("o1", null, null));

        assertThat(graded.nhomLoi()).isEqualTo(NhomLoi.CAP_NHAM);
        assertThat(graded.nham()).containsExactly(new Confusion(10L, 20L));
    }

    @Test
    void skippedChoiceIsWrongWithoutConfusion() {
        Graded graded = PracticeGrader.grade(choice(LoaiCau.CHON_TU), Answer.TRONG);

        assertThat(graded.dung()).isFalse();
        assertThat(graded.traLoi()).isNull();
        assertThat(graded.loi()).containsExactly(new Mistake(10L, NhomLoi.NGHIA, null, "hóa đơn", null));
        assertThat(graded.nham()).isEmpty();
    }

    @Test
    void typedAnswerIgnoresCaseAndSpaces() {
        Graded graded = PracticeGrader.grade(typed(LoaiCau.NGHE_VIET, "receipt", null),
                new Answer(null, "  ReCEIPT ", null));

        assertThat(graded.dung()).isTrue();
    }

    @Test
    void typedNearAnswerIsSpelling() {
        Graded graded = PracticeGrader.grade(typed(LoaiCau.NGHE_VIET, "receipt", null),
                new Answer(null, "reciept", null));

        assertThat(graded.dung()).isFalse();
        assertThat(graded.nhomLoi()).isEqualTo(NhomLoi.CHINH_TA);
        assertThat(graded.traLoi()).containsEntry("noiDung", "reciept");
    }

    @Test
    void typedFarAnswerFollowsQuestionType() {
        Answer far = new Answer(null, "table", null);

        assertThat(PracticeGrader.grade(typed(LoaiCau.NGHE_VIET, "receipt", null), far).nhomLoi())
                .isEqualTo(NhomLoi.NGHE);
        assertThat(PracticeGrader.grade(typed(LoaiCau.NHAP_TU_THEO_NGHIA, "receipt", null), far).nhomLoi())
                .isEqualTo(NhomLoi.NGHIA);
        assertThat(PracticeGrader.grade(typed(LoaiCau.DIEN_CHO_TRONG, "receipt", "receipt"), far).nhomLoi())
                .isEqualTo(NhomLoi.NGU_CANH);
    }

    @Test
    void blankWithBaseFormIsContextError() {
        Graded graded = PracticeGrader.grade(typed(LoaiCau.DIEN_CHO_TRONG, "decided", "decide"),
                new Answer(null, "decide", null));

        assertThat(graded.dung()).isFalse();
        assertThat(graded.nhomLoi()).isEqualTo(NhomLoi.NGU_CANH);
    }

    @Test
    void matchScoresEachPair() {
        Map<String, String> cap = new LinkedHashMap<>();
        cap.put("t1", "n1");
        cap.put("t2", "n3");

        Graded graded = PracticeGrader.grade(match(), new Answer(null, null, cap));

        assertThat(graded.dung()).isFalse();
        assertThat(graded.diem()).isEqualTo(33);
        assertThat(graded.nhomLoi()).isEqualTo(NhomLoi.NGHIA);
        assertThat(graded.chiTiet()).hasSize(3);
        assertThat(graded.chiTiet().get(1))
                .containsEntry("nghiaDaChon", "hoàn tiền")
                .containsEntry("nghiaDung", "hóa đơn")
                .containsEntry("dung", false);
        assertThat(graded.loi()).extracting(Mistake::theId).containsExactly(12L, 13L);
        assertThat(graded.nham()).containsExactly(new Confusion(12L, 13L));
    }

    @Test
    void thresholdGrowsWithLength() {
        assertThat(PracticeGrader.threshold(4)).isEqualTo(1);
        assertThat(PracticeGrader.threshold(5)).isEqualTo(2);
        assertThat(PracticeGrader.threshold(8)).isEqualTo(2);
        assertThat(PracticeGrader.threshold(9)).isEqualTo(3);
        assertThat(PracticeGrader.distance("teh", "the")).isEqualTo(1);
        assertThat(PracticeGrader.distance("cat", "dog")).isEqualTo(3);
    }

    @Test
    void scoreUsesExactFractions() {
        assertThat(PracticeGrader.score(List.of(graded(1), graded(0), graded(1.0 / 3)))).isEqualTo(44);
        assertThat(PracticeGrader.score(List.of(graded(1), graded(0.5)))).isEqualTo(75);
        assertThat(PracticeGrader.score(List.of())).isZero();
    }

    private static Question choice(LoaiCau loaiCau) {
        DapAn dapAn = new DapAn("o2", "hóa đơn", null, null,
                List.of(new Choice("o1", "20"), new Choice("o2", "10")), null);
        return new Question(loaiCau, 10L, null,
                List.of(new Option("o1", "biên lai"), new Option("o2", "hóa đơn")), null, null, dapAn);
    }

    private static Question typed(LoaiCau loaiCau, String dapAn, String tuGoc) {
        return new Question(loaiCau, 10L, tuGoc, null, null, null,
                new DapAn(null, dapAn, List.of(dapAn), null, null, null));
    }

    private static Question match() {
        return new Question(LoaiCau.GHEP_TU, null, null, null,
                List.of(new Option("t1", "receipt"), new Option("t2", "invoice"), new Option("t3", "refund")),
                List.of(new Option("n1", "biên lai"), new Option("n2", "hóa đơn"), new Option("n3", "hoàn tiền")),
                new DapAn(null, null, null, null, null, List.of(
                        new Link("t1", "n1", "11"),
                        new Link("t2", "n2", "12"),
                        new Link("t3", "n3", "13"))));
    }

    private static Graded graded(double ty) {
        return new Graded(ty == 1, ty, null, null, null, List.of(), List.of());
    }
}
