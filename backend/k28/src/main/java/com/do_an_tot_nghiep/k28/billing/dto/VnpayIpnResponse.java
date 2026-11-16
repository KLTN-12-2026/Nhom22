package com.do_an_tot_nghiep.k28.billing.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record VnpayIpnResponse(
        @JsonProperty("RspCode") String rspCode,
        @JsonProperty("Message") String message
) {
}
