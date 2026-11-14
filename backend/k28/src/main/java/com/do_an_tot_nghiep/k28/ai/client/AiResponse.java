package com.do_an_tot_nghiep.k28.ai.client;

public record AiResponse(
        String noiDung,
        String model,
        String providerRequestId,
        Integer tokenVao,
        Integer tokenRa
) {
}
