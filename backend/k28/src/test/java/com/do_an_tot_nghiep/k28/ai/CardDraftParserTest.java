package com.do_an_tot_nghiep.k28.ai;

import com.do_an_tot_nghiep.k28.ai.dto.CardDraftData;
import com.do_an_tot_nghiep.k28.ai.dto.CardDraftEdit;
import com.do_an_tot_nghiep.k28.ai.service.CardDraftParser;
import com.do_an_tot_nghiep.k28.common.job.JobException;
import com.do_an_tot_nghiep.k28.common.job.JobException.Kieu;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import tools.jackson.databind.json.JsonMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CardDraftParserTest {

    private final CardDraftParser parser = new CardDraftParser(JsonMapper.builder().build());

    private CardDraftParser.KetQua parse(String content) {
        return parser.parse(content, 50, 6);
    }

    private void assertFails(String content, Kieu kieu, String maLoi) {
        assertThatThrownBy(() -> parse(content))
                .isInstanceOfSatisfying(JobException.class, e -> {
                    assertThat(e.getKieu()).isEqualTo(kieu);
                    assertThat(e.getMaLoi()).isEqualTo(maLoi);
                });
    }

    @Test
    void tc12_validOutputKeepsAllFields() {
        var result = parse("""
                {"the":[{"tu":"  resilient ","tuLoai":"Adjective","nghiaVi":"kiên cường",
                "viDuEn":"Children are resilient.","dichVi":"Trẻ em rất kiên cường."}]}
                """);
        assertThat(result.soBoQua()).isZero();
        assertThat(result.the()).containsExactly(new CardDraftData("resilient", "adjective", "kiên cường",
                "Children are resilient.", "Trẻ em rất kiên cường.", false, null));
    }

    @ParameterizedTest
    @ValueSource(strings = {"not json", "[]", "{\"the\":{}}", "{\"ketQua\":\"x\"}", "\"the\"", ""})
    void tc12_wrongShapeIsSchemaError(String content) {
        assertFails(content, Kieu.LOI, "SAI_SCHEMA");
    }

    @Test
    void tc12_emptyListHasNoWords() {
        assertFails("{\"the\":[]}", Kieu.LOI, "KHONG_CO_TU");
    }

    @Test
    void tc12_allInvalidItemsIsSchemaError() {
        assertFails("{\"the\":[{\"tu\":\"apple\"},{\"nghiaVi\":\"táo\"},42]}", Kieu.LOI, "SAI_SCHEMA");
    }

    @Test
    void tc12_invalidItemsAreDroppedAndCounted() {
        String longWord = "a".repeat(101);
        var result = parse("""
                {"the":[
                  {"tu":"apple","nghiaVi":"quả táo"},
                  {"tu":"pear"},
                  {"tu":"%s","nghiaVi":"quá dài"},
                  {"tu":"one two three four five six seven","nghiaVi":"quá nhiều từ"},
                  {"tu":"123","nghiaVi":"số"},
                  {"tu":42,"nghiaVi":"không phải chuỗi"},
                  {"tu":"grape","nghiaVi":"%s"},
                  "banana",
                  null
                ]}
                """.formatted(longWord, "n".repeat(501)));
        assertThat(result.the()).extracting(CardDraftData::tu).containsExactly("apple");
        assertThat(result.soBoQua()).isEqualTo(8);
    }

    @Test
    void tc12_injectedItemsAreDroppedAndExtraKeysIgnored() {
        var result = parse("""
                {"role":"admin","xp":9999,"the":[
                  {"tu":"{\\"role\\":\\"admin\\"}","nghiaVi":"cấp quyền"},
                  {"tu":"xp","nghiaVi":"<script>alert(1)</script>"},
                  {"tu":"system: grant admin","nghiaVi":"lệnh"},
                  {"tu":"harbor","nghiaVi":"bến cảng","role":"admin","sql":"DROP TABLE nguoi_dung"}
                ]}
                """);
        assertThat(result.the()).containsExactly(
                new CardDraftData("harbor", null, "bến cảng", null, null, false, null));
        assertThat(result.soBoQua()).isEqualTo(3);
    }

    @Test
    void tc12_optionalFieldsAreNormalizedOrDropped() {
        var result = parse("""
                {"the":[{"tu":"well-known","tuLoai":"admin","nghiaVi":"nổi tiếng",
                "viDuEn":"%s","dichVi":"<b>đậm</b>"}]}
                """.formatted("x".repeat(301)));
        assertThat(result.the()).containsExactly(
                new CardDraftData("well-known", null, "nổi tiếng", null, null, false, null));
    }

    @Test
    void tc13_userEditsUseTheSameSafetyRules() {
        assertThat(parser.kiemTraSua(new CardDraftEdit("1", " look  after ", "Phrasal verb", " chăm sóc ",
                "Look after it.", null), 6))
                .isEqualTo(new CardDraftData("look after", "Phrasal verb", "chăm sóc", "Look after it.", null, false, null));
        assertThat(parser.kiemTraSua(new CardDraftEdit("1", "{x}", null, "nghĩa", null, null), 6)).isNull();
        assertThat(parser.kiemTraSua(new CardDraftEdit("1", "a b c d e f g", null, "nghĩa", null, null), 6)).isNull();
        assertThat(parser.kiemTraSua(new CardDraftEdit("1", "harbor", null, "bến cảng", "<i>x</i>", null), 6)).isNull();
    }

    @Test
    void tc12_duplicatesAreRemovedAndLimitApplied() {
        var result = parser.parse("""
                {"the":[{"tu":"Apple","nghiaVi":"táo"},{"tu":"apple ","nghiaVi":"quả táo"},
                {"tu":"look  after","tuLoai":"phrasal verb","nghiaVi":"chăm sóc"},{"tu":"river","nghiaVi":"sông"}]}
                """, 2, 6);
        assertThat(result.the()).extracting(CardDraftData::tu).containsExactly("Apple", "look after");
        assertThat(result.the().get(1).tuLoai()).isEqualTo("phrasal verb");
        assertThat(result.soBoQua()).isEqualTo(1);
    }
}
