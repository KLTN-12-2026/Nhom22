package com.do_an_tot_nghiep.k28.content.service;

import com.do_an_tot_nghiep.k28.content.dto.CsvPreviewResponse;
import java.time.Instant;
import java.util.List;

public record CsvImportSnapshot(Long ownerId, Long deckId, String importId,
                                Instant expiresAt, List<String> ignoredColumns,
                                List<CsvPreviewResponse.Row> rows) {
    public CsvImportSnapshot {
        ignoredColumns = List.copyOf(ignoredColumns);
        rows = List.copyOf(rows);
    }

    public CsvPreviewResponse toResponse() {
        int valid = (int) rows.stream().filter(CsvPreviewResponse.Row::valid).count();
        return new CsvPreviewResponse(importId, deckId.toString(), expiresAt,
                rows.size(), valid, rows.size() - valid, ignoredColumns, rows);
    }
}
