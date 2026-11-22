package com.do_an_tot_nghiep.k28.content.dto;

import com.do_an_tot_nghiep.k28.common.web.PageResponse;

import java.util.List;

public record LibrarySuggestResponse(
        String q,
        PageResponse<LibrarySearchCardResponse> tuVung,
        PageResponse<LibraryDeckResponse> boThe,
        PageResponse<LibraryAuthorResponse> tacGia,
        List<LibrarySearchTopicResponse> chuDe,
        Mine cuaToi
) {

    public record Mine(
            PageResponse<LibraryDeckResponse> boThe,
            PageResponse<LibrarySearchCardResponse> tuVung
    ) {
    }
}
