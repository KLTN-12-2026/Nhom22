package com.do_an_tot_nghiep.k28.content.dto;

import java.time.Instant;
import java.util.List;

public record AuthorProfileResponse(
        String id,
        String tenHienThi,
        long soBoThe,
        long soThe,
        Instant thamGiaAt,
        String anhDaiDienUrl,
        List<PublicBadgeResponse> huyHieu
) {
}
