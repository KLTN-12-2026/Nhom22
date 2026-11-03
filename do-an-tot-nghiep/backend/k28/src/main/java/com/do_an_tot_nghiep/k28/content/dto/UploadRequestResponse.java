package com.do_an_tot_nghiep.k28.content.dto;

import java.time.Instant;

public record UploadRequestResponse(
        String fileId,
        String uploadUrl,
        Instant expiresAt
) {
}
