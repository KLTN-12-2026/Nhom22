package com.do_an_tot_nghiep.k28.ai.service;

import com.do_an_tot_nghiep.k28.ai.dto.CardDraftData;
import com.do_an_tot_nghiep.k28.ai.dto.CardDraftEdit;
import com.do_an_tot_nghiep.k28.common.job.JobException;
import com.do_an_tot_nghiep.k28.common.job.JobException.Kieu;
import com.do_an_tot_nghiep.k28.content.service.CardDraftTargetService;
import com.do_an_tot_nghiep.k28.content.service.CardText;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@Component
@RequiredArgsConstructor
public class CardDraftParser {

    public record KetQua(List<CardDraftData> the, int soBoQua) {
    }

    static final int MAX_TU = 100;
    static final int MAX_TU_LOAI = 30;
    static final int MAX_NGHIA = 500;
    static final int MAX_VI_DU = 300;

    private static final Pattern TERM = Pattern.compile("^\\p{L}[\\p{L}\\p{M}'’ \\-]*$");
    private static final Pattern UNSAFE = Pattern.compile("[<>{}\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F]");
    private static final Set<String> TU_LOAI = Set.of("noun", "verb", "adjective", "adverb", "phrase",
            "phrasal verb", "idiom", "preposition", "conjunction", "pronoun", "determiner", "interjection");

    private final JsonMapper json;

    public KetQua parse(String content, int maxThe, int maxTuMoiThe) {
        JsonNode root;
        try {
            root = json.readTree(content == null ? "" : content);
        } catch (JacksonException e) {
            throw new JobException(Kieu.LOI, "SAI_SCHEMA");
        }
        if (root == null || !root.isObject() || !root.path("the").isArray()) {
            throw new JobException(Kieu.LOI, "SAI_SCHEMA");
        }
        JsonNode items = root.path("the");
        if (items.isEmpty()) {
            throw new JobException(Kieu.LOI, "KHONG_CO_TU");
        }
        List<CardDraftData> result = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        int skipped = 0;
        for (JsonNode node : items) {
            if (result.size() == maxThe) {
                break;
            }
            CardDraftData item = item(node, maxTuMoiThe);
            if (item == null || !seen.add(CardDraftTargetService.termKey(item.tu()))) {
                skipped++;
                continue;
            }
            result.add(item);
        }
        if (result.isEmpty()) {
            throw new JobException(Kieu.LOI, "SAI_SCHEMA");
        }
        return new KetQua(List.copyOf(result), skipped);
    }

    public CardDraftData kiemTraSua(CardDraftEdit edit, int maxTuMoiThe) {
        String tu = edit.tu();
        if (tu == null || tu.isEmpty() || tu.length() > MAX_TU || !TERM.matcher(tu).matches()
                || tu.split(" ").length > maxTuMoiThe) {
            return null;
        }
        for (String value : new String[]{edit.tuLoai(), edit.nghiaVi(), edit.viDuEn(), edit.dichVi()}) {
            if (value != null && UNSAFE.matcher(value).find()) {
                return null;
            }
        }
        return new CardDraftData(tu, edit.tuLoai(), edit.nghiaVi(), edit.viDuEn(), edit.dichVi(), false, null);
    }

    private CardDraftData item(JsonNode node, int maxTuMoiThe) {
        if (node == null || !node.isObject()) {
            return null;
        }
        String tu = CardText.term(text(node, "tu"));
        if (tu == null || tu.isEmpty() || tu.length() > MAX_TU || !TERM.matcher(tu).matches()
                || tu.split(" ").length > maxTuMoiThe) {
            return null;
        }
        String nghiaVi = CardText.term(text(node, "nghiaVi"));
        if (nghiaVi == null || nghiaVi.isEmpty() || nghiaVi.length() > MAX_NGHIA || UNSAFE.matcher(nghiaVi).find()) {
            return null;
        }
        return new CardDraftData(tu, tuLoai(text(node, "tuLoai")), nghiaVi,
                optional(text(node, "viDuEn")), optional(text(node, "dichVi")), false, null);
    }

    private String tuLoai(String value) {
        String normalized = CardText.term(value);
        if (normalized == null) {
            return null;
        }
        normalized = normalized.toLowerCase(Locale.ROOT);
        return normalized.length() <= MAX_TU_LOAI && TU_LOAI.contains(normalized) ? normalized : null;
    }

    private String optional(String value) {
        String normalized = CardText.term(value);
        if (normalized == null || normalized.isEmpty() || normalized.length() > MAX_VI_DU
                || UNSAFE.matcher(normalized).find()) {
            return null;
        }
        return normalized;
    }

    private String text(JsonNode node, String field) {
        JsonNode value = node.path(field);
        return value.isString() ? value.asString() : null;
    }
}
