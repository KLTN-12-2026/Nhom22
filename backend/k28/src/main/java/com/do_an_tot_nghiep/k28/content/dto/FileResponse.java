package com.do_an_tot_nghiep.k28.content.dto;

import java.time.Instant;

public record FileResponse(
        String id,
        String loai,
        String mimeType,
        long kichThuoc,
        String checksum,
        Instant hoanTatAt,
        String downloadUrl,
        Instant expiresAt
) {
}