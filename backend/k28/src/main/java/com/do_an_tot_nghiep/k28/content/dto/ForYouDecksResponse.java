package com.do_an_tot_nghiep.k28.content.dto;

import java.util.List;

public record ForYouDecksResponse(
        boolean daChonChuDe,
        List<LibraryDeckResponse> boThe
) {
}
