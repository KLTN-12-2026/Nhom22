package com.do_an_tot_nghiep.k28.practice.dto;

import java.util.List;
import java.util.Map;

public record NotebookResponse(
        Map<String, Integer> tongHop,
        List<NotebookItemResponse> items,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
