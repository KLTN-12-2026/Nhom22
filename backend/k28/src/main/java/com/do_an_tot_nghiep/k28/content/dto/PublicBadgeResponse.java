package com.do_an_tot_nghiep.k28.content.dto;

import java.time.Instant;

public record PublicBadgeResponse(
        String ma,
        String ten,
        String moTa,
        Instant nhanAt
) {
}
