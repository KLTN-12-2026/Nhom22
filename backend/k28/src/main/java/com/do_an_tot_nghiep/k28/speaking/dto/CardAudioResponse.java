package com.do_an_tot_nghiep.k28.speaking.dto;

import java.time.Instant;

public record CardAudioResponse(
        String id,
        String loai,
        String mimeType,
        long kichThuoc,
        String checksum,
        Instant hoanTatAt,
        String downloadUrl,
        Instant expiresAt,
        String nguon,
        boolean moPhong
) {
}
