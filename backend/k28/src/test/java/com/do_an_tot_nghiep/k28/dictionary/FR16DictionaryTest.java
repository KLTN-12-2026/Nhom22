package com.do_an_tot_nghiep.k28.dictionary;

import com.do_an_tot_nghiep.k28.dictionary.entity.enums.ChieuTuDien;
import com.do_an_tot_nghiep.k28.dictionary.repository.DictionaryImportRepository;
import com.do_an_tot_nghiep.k28.dictionary.service.DictionaryImporter;
import com.do_an_tot_nghiep.k28.dictionary.service.DictionaryText;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import tools.jackson.databind.JsonNode;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class FR16DictionaryTest extends AbstractIntegrationTest {

    private static final String PATH = "/api/v1/dictionary";

    @Autowired DictionaryImporter importer;
    @Autowired DictionaryImportRepository imports;

    @BeforeEach
    void loadDictionary() {
        importer.importAll();
    }

    @Test
    void importIsIdempotent() {
        long anhViet = imports.count(ChieuTuDien.ANH_VIET);
        long vietAnh = imports.count(ChieuTuDien.VIET_ANH);

        importer.importAll();

        assertThat(anhViet).isEqualTo(6);
        assertThat(vietAnh).isEqualTo(7);
        assertThat(imports.count(ChieuTuDien.ANH_VIET)).isEqualTo(anhViet);
        assertThat(imports.count(ChieuTuDien.VIET_ANH)).isEqualTo(vietAnh);
    }

    @Test
    void normalizeStripsVietnameseMarksAndCase() {
        assertThat(DictionaryText.normalize("  Học   Sinh ")).isEqualTo("hoc sinh");
        assertThat(DictionaryText.normalize("Đường")).isEqualTo("duong");
        assertThat(DictionaryText.likePrefix("50%_a")).isEqualTo("50\\%\\_a%");
    }

    @Test
    void guestSuggestsEnglishHeadwordsByPrefixShortestFirst() throws Exception {
        mockMvc.perform(get(PATH + "/suggest").param("q", "run"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].tu").value("run"))
                .andExpect(jsonPath("$[0].phienAm").value("/rʌn/"))
                .andExpect(jsonPath("$[0].tomTat").isNotEmpty())
                .andExpect(jsonPath("$[1].tu").value("runner"))
                .andExpect(jsonPath("$[2].tu").value("runway"))
                .andExpect(jsonPath("$.length()").value(4))
                .andExpect(jsonPath("$[*].tu", not(hasItem("take"))));
    }

    @Test
    void vietnameseSuggestIgnoresAccentsAndPrefersExactSpelling() throws Exception {
        mockMvc.perform(get(PATH + "/suggest").param("q", "hoc").param("chieu", "VIET_ANH"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(5))
                .andExpect(jsonPath("$[*].tu", hasItem("học sinh")));

        mockMvc.perform(get(PATH + "/suggest").param("q", "học").param("chieu", "VIET_ANH"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].tu").value("học"));
    }

    @Test
    void vietnameseMeaningFindsEnglishWordsAccentSensitively() throws Exception {
        mockMvc.perform(get(PATH + "/by-meaning").param("q", "chạy"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].tu").value("run"))
                .andExpect(jsonPath("$[*].tu", hasItem("running")))
                .andExpect(jsonPath("$[*].tu", not(hasItem("take"))));

        mockMvc.perform(get(PATH + "/by-meaning").param("q", "chảy"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].tu", not(hasItem("run"))));

        mockMvc.perform(get(PATH + "/by-meaning").param("q", "100%"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void lookupReturnsStructuredEntryAndRelatedWords() throws Exception {
        String body = mockMvc.perform(get(PATH + "/lookup").param("q", "Run"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.chieu").value("ANH_VIET"))
                .andExpect(jsonPath("$.ketQua.length()").value(1))
                .andExpect(jsonPath("$.ketQua[0].tu").value("run"))
                .andExpect(jsonPath("$.ketQua[0].noiDung.nhom[0].tuLoai").value("danh từ"))
                .andExpect(jsonPath("$.ketQua[0].noiDung.nhom[0].nghia[0].noiDung").value("sự chạy"))
                .andExpect(jsonPath("$.ketQua[0].noiDung.nhom[0].nghia[0].viDu[0].cau").value("at a run"))
                .andExpect(jsonPath("$.goiY[*].tu", hasItem("runner")))
                .andExpect(jsonPath("$.goiY[*].tu", not(hasItem("run"))))
                .andReturn().getResponse().getContentAsString();

        JsonNode entry = jsonMapper.readTree(body).get("ketQua").get(0);
        mockMvc.perform(get(PATH + "/entries/" + entry.get("id").asString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tu").value("run"))
                .andExpect(jsonPath("$.noiDung.nhom").isArray());
    }

    @Test
    void lookupUnknownWordReturnsEmptyResult() throws Exception {
        mockMvc.perform(get(PATH + "/lookup").param("q", "zzzz"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ketQua.length()").value(0))
                .andExpect(jsonPath("$.goiY.length()").value(0));
    }

    @Test
    void wildcardsAreLiteral() throws Exception {
        mockMvc.perform(get(PATH + "/suggest").param("q", "%"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void invalidQueriesAreRejected() throws Exception {
        mockMvc.perform(get(PATH + "/suggest").param("q", " "))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get(PATH + "/suggest").param("q", "run").param("limit", "50"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get(PATH + "/suggest").param("q", "run").param("chieu", "PHAP_VIET"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get(PATH + "/entries/999999999"))
                .andExpect(status().isNotFound());
    }
}
