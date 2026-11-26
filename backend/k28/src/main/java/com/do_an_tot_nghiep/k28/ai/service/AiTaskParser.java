package com.do_an_tot_nghiep.k28.ai.service;

import com.do_an_tot_nghiep.k28.ai.dto.ContextExplanationResult;
import com.do_an_tot_nghiep.k28.ai.dto.MistakeExplanationResult;
import com.do_an_tot_nghiep.k28.ai.dto.SentenceFeedbackResult;
import com.do_an_tot_nghiep.k28.common.job.JobException;
import com.do_an_tot_nghiep.k28.common.job.JobException.Kieu;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@Component
@RequiredArgsConstructor
public class AiTaskParser {

    static final int MAX_TEXT = 1000;
    static final int MAX_LOI = 10;
    private static final Set<String> TU_LOAI = Set.of("noun", "verb", "adjective", "adverb", "phrase",
            "phrasal verb", "idiom", "preposition", "conjunction", "pronoun", "determiner", "interjection");

    private final JsonMapper json;

    public ContextExplanationResult nguCanh(String content) {
        JsonNode root = root(content);
        String phienAm = optional(root, "phienAm", 100);
        String tuLoai = optional(root, "tuLoai", 30);
        return new ContextExplanationResult(
                required(root, "tu", 100),
                tuLoai != null && TU_LOAI.contains(tuLoai.toLowerCase(Locale.ROOT)) ? tuLoai.toLowerCase(Locale.ROOT) : null,
                phienAm != null && phienAm.matches("/[^/]+/") ? phienAm : null,
                required(root, "nghiaVi", 300),
                required(root, "giaiThich", MAX_TEXT),
                required(root, "viDuEn", 500),
                required(root, "dichVi", 500),
                optional(root, "meoNho", 500),
                optional(root, "doanLienQuan", MAX_TEXT));
    }

    public MistakeExplanationResult giaiThichLoi(String content) {
        JsonNode root = root(content);
        return new MistakeExplanationResult(required(root, "giaiThich", MAX_TEXT),
                optional(root, "meoNho", 500), optional(root, "viDu", 500));
    }

    public SentenceFeedbackResult suaCau(String content) {
        JsonNode root = root(content);
        JsonNode items = root.get("loi");
        JsonNode dung = root.get("dungTuMucTieu");
        if (items == null || !items.isArray() || dung == null || !dung.isBoolean()) {
            throw schema();
        }
        List<SentenceFeedbackResult.LoiCau> loi = new ArrayList<>();
        for (JsonNode item : items) {
            if (loi.size() == MAX_LOI || !item.isObject()) {
                continue;
            }
            String loai = optional(item, "loai", 20);
            String goc = optional(item, "doanGoc", 500);
            String sua = optional(item, "doanSua", 500);
            String giaiThich = optional(item, "giaiThich", MAX_TEXT);
            if (loai != null && AiTaskPrompt.LOAI_LOI.contains(loai) && goc != null && sua != null && giaiThich != null) {
                loi.add(new SentenceFeedbackResult.LoiCau(loai, goc, sua, giaiThich));
            }
        }
        return new SentenceFeedbackResult(required(root, "cauGoc", 500), required(root, "cauSua", 500),
                dung.asBoolean(), loi, required(root, "nhanXet", MAX_TEXT), required(root, "cachDungTu", MAX_TEXT));
    }

    private JsonNode root(String content) {
        try {
            JsonNode root = json.readTree(content);
            if (root == null || !root.isObject()) {
                throw schema();
            }
            return root;
        } catch (JacksonException e) {
            throw schema();
        }
    }

    private static String required(JsonNode node, String field, int max) {
        String value = optional(node, field, max);
        if (value == null) {
            throw schema();
        }
        return value;
    }

    private static String optional(JsonNode node, String field, int max) {
        JsonNode value = node.get(field);
        if (value == null || !value.isString()) {
            return null;
        }
        String text = value.asString().strip();
        if (text.isEmpty()) {
            return null;
        }
        return text.codePointCount(0, text.length()) <= max ? text : null;
    }

    private static JobException schema() {
        return new JobException(Kieu.LOI, "SAI_SCHEMA");
    }
}
