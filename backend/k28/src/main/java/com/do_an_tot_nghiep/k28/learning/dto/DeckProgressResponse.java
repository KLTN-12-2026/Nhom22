package com.do_an_tot_nghiep.k28.learning.dto;

import java.util.List;
import java.util.Map;

public record DeckProgressResponse(
        String boTheId,
        String ten,
        String muiGio,
        long tongSoThe,
        Map<NhomTienDo, Long> tongHop,
        List<DeckProgressItemResponse> items,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
