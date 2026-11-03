package com.do_an_tot_nghiep.k28.content.service;

import com.do_an_tot_nghiep.k28.content.dto.CsvMappingRequest;
import com.do_an_tot_nghiep.k28.content.dto.CsvPreviewResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class CsvPreviewService {
    private final CsvImportParser parser;
    private final CsvRowValidator validator;
    private final CsvPreviewRulesService rules;
    private final CsvImportSnapshotStore snapshots;

    public CsvPreviewResponse preview(Long userId, Long deckId, MultipartFile file,
                                      CsvMappingRequest mapping) {
        rules.requireOwnedDeck(userId, deckId);
        var parsed = parser.parse(file, mapping);
        var rows = parsed.rows().stream().map(validator::validate).toList();
        return snapshots.create(userId, deckId, parsed.ignoredColumns(),
                rules.evaluate(userId, deckId, rows)).toResponse();
    }
}
