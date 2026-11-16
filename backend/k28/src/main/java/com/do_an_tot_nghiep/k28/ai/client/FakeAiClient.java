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
    static final String SCHEMA_NGU_CANH = "context_explanation";
    static final String SCHEMA_SUA_CAU = "sentence_feedback";
    private static final Pattern TU = Pattern.compile("<tu>(.*?)</tu>", Pattern.DOTALL);
    private static final Pattern CAU = Pattern.compile("<cau>\n(.*)\n</cau>", Pattern.DOTALL);
    private static final Pattern NGU_CANH = Pattern.compile("<ngu_canh>\n(.*)\n</ngu_canh>", Pattern.DOTALL);

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
            case INJECTION -> response(request, json.writeValueAsString(switch (request.schemaName()) {
                case SCHEMA_NGU_CANH, SCHEMA_SUA_CAU -> withInjection(task(request.schemaName(), text));
                default -> injected(drafts(text, request.maxThe()));
            }));
            case THANH_CONG -> response(request, json.writeValueAsString(switch (request.schemaName()) {
                case SCHEMA_NGU_CANH, SCHEMA_SUA_CAU -> task(request.schemaName(), text);
                default -> Map.of("the", drafts(text, request.maxThe()));
            }));
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

    private Map<String, Object> task(String schema, String prompt) {
        String tu = group(TU, prompt, "word").strip().toLowerCase(Locale.ROOT);
        Map<String, Object> result = new LinkedHashMap<>();
        if (SCHEMA_NGU_CANH.equals(schema)) {
            String nguCanh = group(NGU_CANH, prompt, "").strip();
            result.put("tu", tu);
            result.put("tuLoai", null);
            result.put("phienAm", null);
            result.put("nghiaVi", "Nghĩa mô phỏng của \"" + tu + "\"");
            result.put("giaiThich", "Giải thích mô phỏng, chưa gọi dịch vụ AI thật.");
            result.put("viDuEn", "This is a simple example with " + tu + ".");
            result.put("dichVi", "Đây là ví dụ đơn giản có từ " + tu + ".");
            result.put("meoNho", null);
            result.put("doanLienQuan", nguCanh.isEmpty() ? null : example(nguCanh, tu));
            return result;
        }
        String cau = group(CAU, prompt, "").strip();
        String sua = cau.isEmpty() ? cau : Character.toUpperCase(cau.charAt(0)) + cau.substring(1);
        List<Map<String, Object>> loi = new ArrayList<>();
        if (!sua.isEmpty() && !sua.matches(".*[.!?]$")) {
            sua = sua + ".";
            loi.add(Map.of("loai", "PHONG_CACH", "doanGoc", cau, "doanSua", sua,
                    "giaiThich", "Gợi ý mô phỏng: kết thúc câu bằng dấu chấm."));
        }
        result.put("cauGoc", cau);
        result.put("cauSua", sua);
        result.put("dungTuMucTieu", cau.toLowerCase(Locale.ROOT).contains(tu));
        result.put("loi", loi);
        result.put("nhanXet", "Nhận xét mô phỏng, chưa gọi dịch vụ AI thật.");
        result.put("cachDungTu", "Cách dùng mô phỏng của \"" + tu + "\".");
        return result;
    }

    private Map<String, Object> withInjection(Map<String, Object> result) {
        Map<String, Object> root = new LinkedHashMap<>(result);
        root.put("role", "admin");
        root.put("xp", 9999);
        return root;
    }

    private static String group(Pattern pattern, String text, String fallback) {
        Matcher matcher = pattern.matcher(text);
        return matcher.find() ? matcher.group(1) : fallback;
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
