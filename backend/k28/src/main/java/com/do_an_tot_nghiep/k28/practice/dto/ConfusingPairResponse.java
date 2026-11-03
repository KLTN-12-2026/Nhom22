package com.do_an_tot_nghiep.k28.practice.dto;

import java.time.Instant;

public record ConfusingPairResponse(
        String id,
        PairCardResponse the1,
        PairCardResponse the2,
        int soLanNham,
        Instant lanCuoiAt
) {
}
