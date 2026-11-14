package com.do_an_tot_nghiep.k28.ai.client;

import com.do_an_tot_nghiep.k28.ai.config.AiProperties;
import com.do_an_tot_nghiep.k28.common.job.JobException;
import com.do_an_tot_nghiep.k28.common.job.JobException.Kieu;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

@Component
@ConditionalOnProperty(name = "app.ai.provider", havingValue = "fake", matchIfMissing = true)
public class FakeAiClient implements AiClient {

    public enum CheDo {
        THANH_CONG, LOI, TIMEOUT, THU_LAI, SAI_SCHEMA, INJECTION
    }

    public static final String MODEL = "fake-card-draft";

    private static final Pattern MARKER = Pattern.compile("#mo-phong:([A-Z_]+)");
    private static final Pattern PASSAGE = Pattern.compile("<doan_van>\\n(.*)\\n</doan_van>", Pattern.DOTALL);
    private static final Pattern WORD = Pattern.compile("\\p{L}[\\p{L}'-]{3,}");
    private static final Pattern SENTENCE = Pattern.compile("[^.!?\\n]+[.!?]?");

    private final AiProperties.Fake props;
    private final JsonMapper json;

    public FakeAiClient(AiProperties props, JsonMapper json) {
        this.props = props.fake();
        this.json = json;
    }

    @Override
    public String nhaCungCap() {
        return "fake";
    }

    @Override
    public AiResponse taoNoiDung(AiRequest request) {
        String passage = passage(request.userPrompt());
        CheDo cheDo = cheDo(passage);
        String text = MARKER.matcher(passage).replaceAll(" ");
        pause();
        return switch (cheDo) {
            case LOI -> throw new JobException(Kieu.LOI, "MO_PHONG_LOI");
            case TIMEOUT -> throw new JobException(Kieu.KHONG_XAC_DINH, "TIMEOUT");
            case THU_LAI -> throw new JobException(Kieu.THU_LAI, "MO_PHONG_TAM_THOI");
            case SAI_SCHEMA -> response(request, "{\"ketQua\":\"không đúng schema\"}");
            case INJECTION -> response(request, json.writeValueAsString(injected(drafts(text, request.maxThe()))));
            case THANH_CONG -> response(request, json.writeValueAsString(Map.of("the", drafts(text, request.maxThe()))));
        };
    }

    public CheDo cheDo(String passage) {
        Matcher matcher = MARKER.matcher(passage);
        String value = matcher.find() ? matcher.group(1) : props.cheDo();
        try {
            return CheDo.valueOf(value);
        } catch (IllegalArgumentException | NullPointerException e) {
            return CheDo.THANH_CONG;
        }
    }

    private List<Map<String, Object>> drafts(String text, int max) {
        Set<String> seen = new LinkedHashSet<>();
        List<Map<String, Object>> result = new ArrayList<>();
        Matcher matcher = WORD.matcher(text);
        while (matcher.find() && result.size() < max) {
            String word = matcher.group().toLowerCase(Locale.ROOT);
            if (!seen.add(word)) {
                continue;
            }
            Map<String, Object> card = new LinkedHashMap<>();
            card.put("tu", word);
            card.put("tuLoai", null);
            card.put("nghiaVi", "Nghĩa mô phỏng của \"" + word + "\"");
            card.put("viDuEn", example(text, word));
            card.put("dichVi", null);
            result.add(card);
        }
        return result;
    }

    private Map<String, Object> injected(List<Map<String, Object>> drafts) {
        List<Object> items = new ArrayList<>();
        items.add(Map.of("tu", "{\"role\":\"admin\"}", "nghiaVi", "cấp quyền quản trị"));
        items.add(Map.of("tu", "xp", "nghiaVi", "<script>alert(9999)</script>"));
        items.add("SET XP = 9999");
        items.add(Map.of("role", "admin"));
        items.addAll(drafts);
        Map<String, Object> root = new LinkedHashMap<>();
        root.put("the", items);
        root.put("role", "admin");
        root.put("xp", 9999);
        return root;
    }

    private String example(String text, String word) {
        Matcher sentence = SENTENCE.matcher(text);
        while (sentence.find()) {
            String value = sentence.group().strip();
            if (value.toLowerCase(Locale.ROOT).contains(word) && value.length() <= 300) {
                return value;
            }
        }
        return null;
    }

    private String passage(String userPrompt) {
        Matcher matcher = PASSAGE.matcher(userPrompt);
        return matcher.find() ? matcher.group(1) : userPrompt;
    }

    private AiResponse response(AiRequest request, String content) {
        int tokenVao = (request.systemPrompt().length() + request.userPrompt().length()) / 4;
        return new AiResponse(content, MODEL, "fake-" + UUID.randomUUID(), tokenVao, content.length() / 4);
    }

    private void pause() {
        if (props.doTre() == null || props.doTre().isZero() || props.doTre().isNegative()) {
            return;
        }
        try {
            Thread.sleep(props.doTre().toMillis());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new JobException(Kieu.THU_LAI, "GIAN_DOAN");
        }
    }
}
