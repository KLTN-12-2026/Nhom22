package com.do_an_tot_nghiep.k28.content.controller;

import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.security.CurrentUser;
import com.do_an_tot_nghiep.k28.content.dto.*;
import com.do_an_tot_nghiep.k28.content.service.CsvCommitService;
import com.do_an_tot_nghiep.k28.content.service.CsvExportService;
import com.do_an_tot_nghiep.k28.content.service.CsvPreviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1")
public class CsvController {
    private final CurrentUser currentUser;
    private final CsvPreviewService preview;
    private final CsvCommitService commit;
    private final CsvExportService export;

    @PostMapping(value = "/decks/{id}/imports/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public CsvPreviewResponse preview(@PathVariable Long id, @RequestPart("file") MultipartFile file,
                                      @Valid @RequestPart(value = "mapping", required = false) CsvMappingRequest mapping) {
        return preview.preview(currentUser.id(), checkedId(id), file, mapping);
    }

    @PostMapping("/imports/{id}/commit")
    public CsvCommitResponse commit(@PathVariable String id,
                                    @RequestHeader(value = "Idempotency-Key", required = false) String key,
                                    @Valid @RequestBody CsvCommitRequest request) {
        return commit.commit(currentUser.id(), id, key, request);
    }

    @GetMapping(value = "/decks/{id}/export", produces = "text/csv")
    public ResponseEntity<byte[]> export(@PathVariable Long id) {
        var bytes = export.export(currentUser.id(), checkedId(id));
        return ResponseEntity.ok().contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"deck-" + id + ".csv\"")
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .header("X-Content-Type-Options", "nosniff").body(bytes);
    }

    private Long checkedId(Long id) {
        if (id == null || id <= 0) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "id", "ID bộ thẻ phải là số nguyên dương");
        }
        return id;
    }
}
