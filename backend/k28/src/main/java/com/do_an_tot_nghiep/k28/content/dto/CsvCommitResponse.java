package com.do_an_tot_nghiep.k28.content.dto;

import java.util.List;

public record CsvCommitResponse(
        String importId,
        String boTheId,
        int importedCount,
        List<ResultItem> items
) {
    public record ResultItem(
            int rowNumber,
            String theId,
            boolean trung,
            List<String> theTrungIds,
            List<Integer> dongTrungNumbers
    ) {
    }
}