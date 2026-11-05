package com.do_an_tot_nghiep.k28.content.dto;

import com.do_an_tot_nghiep.k28.common.web.PageResponse;

public record LibraryDeckDetailResponse(
        LibraryDeckResponse boThe,
        PageResponse<LibraryCardResponse> the
) {
}