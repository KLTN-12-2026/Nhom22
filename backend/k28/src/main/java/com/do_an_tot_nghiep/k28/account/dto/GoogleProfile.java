package com.do_an_tot_nghiep.k28.account.dto;

import java.io.Serializable;
import java.time.Instant;

public record GoogleProfile(
        String subject,
        String email,
        boolean emailVerified,
        String name,
        Instant createdAt
) implements Serializable {
}