package com.do_an_tot_nghiep.k28.ai.client;

import java.util.Map;

public record AiRequest(
        String systemPrompt,
        String userPrompt,
        String schemaName,
        Map<String, Object> schema,
        int maxThe
) {
}
