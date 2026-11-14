package com.do_an_tot_nghiep.k28.notification.dto;

import com.do_an_tot_nghiep.k28.common.web.PageResponse;

public record NotificationListResponse(
        long soChuaDoc,
        PageResponse<NotificationResponse> thongBao
) {
}
