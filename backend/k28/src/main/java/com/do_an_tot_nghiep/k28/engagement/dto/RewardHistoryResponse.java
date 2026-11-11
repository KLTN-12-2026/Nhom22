package com.do_an_tot_nghiep.k28.engagement.dto;

import com.do_an_tot_nghiep.k28.common.web.PageResponse;

public record RewardHistoryResponse(
        long tongDiem,
        long diemHomNay,
        int diemToiDaNgay,
        PageResponse<RewardEventResponse> lichSu
) {
}
