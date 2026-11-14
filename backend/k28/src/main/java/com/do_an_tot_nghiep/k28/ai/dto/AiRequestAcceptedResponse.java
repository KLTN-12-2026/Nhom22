package com.do_an_tot_nghiep.k28.ai.dto;

import com.do_an_tot_nghiep.k28.ai.entity.enums.TrangThaiYeuCauAi;

public record AiRequestAcceptedResponse(String requestId, TrangThaiYeuCauAi trangThai) {
}
