package com.do_an_tot_nghiep.k28.content.dto;

import com.do_an_tot_nghiep.k28.common.exception.ErrorResponse.FieldErrorItem;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record CsvPreviewResponse(
        String importId,
        String boTheId,
        Instant expiresAt,
        int totalRows,
        int validRows,
        int invalidRows,
        List<String> ignoredColumns,
        List<Row> rows
) {

    public record Row(
            int rowNumber,
            Map<String, String> rawValues,
            CsvCardData data,
            boolean valid,
            List<FieldErrorItem> fieldErrors,
            boolean trung,
            List<String> theTrungIds,
            List<Integer> dongTrungNumbers
    ) {
    }
}