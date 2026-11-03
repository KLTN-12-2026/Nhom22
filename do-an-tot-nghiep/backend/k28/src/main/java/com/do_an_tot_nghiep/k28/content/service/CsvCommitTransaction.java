package com.do_an_tot_nghiep.k28.content.service;

import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.content.dto.CsvCommitResponse;
import com.do_an_tot_nghiep.k28.content.dto.CsvPreviewResponse.Row;
import com.do_an_tot_nghiep.k28.content.entity.TheTuVung;
import com.do_an_tot_nghiep.k28.content.mapper.CsvMapper;
import com.do_an_tot_nghiep.k28.content.repository.BoTheRepository;
import com.do_an_tot_nghiep.k28.content.repository.CardLinkRepository;
import com.do_an_tot_nghiep.k28.content.repository.CsvImportRequestRepository;
import com.do_an_tot_nghiep.k28.content.repository.TheTuVungRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;
import java.time.Clock;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CsvCommitTransaction {
    private final CsvImportRequestRepository requests;
    private final BoTheRepository decks;
    private final TheTuVungRepository cards;
    private final CardLinkRepository links;
    private final CsvPreviewRulesService rules;
    private final CsvMapper mapper;
    private final JsonMapper json;
    private final Clock clock;

    @Transactional(readOnly = true, isolation = Isolation.READ_COMMITTED)
    public CsvCommitResponse replay(Long userId, String key, String importId, String hash) {
        return requests.find(userId, key)
                .map(entry -> replay(entry, importId, hash)).orElse(null);
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public CsvCommitResponse commit(Long userId, String key, String hash,
                                     CsvImportSnapshot snapshot, List<Integer> selected) {
        var previous = requests.find(userId, key);
        if (previous.isPresent()) {
            return replay(previous.get(), snapshot.importId(), hash);
        }
        var deck = decks.findOwnedForUpdate(snapshot.deckId(), userId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy bộ thẻ"));
        var entry = requests.reserveAndLock(userId, key, snapshot.importId(),
                deck.getId(), hash, clock.instant());
        checkRequest(entry, snapshot.importId(), hash);
        if (entry.completed()) {
            return replay(entry, snapshot.importId(), hash);
        }
        if (!clock.instant().isBefore(snapshot.expiresAt())) {
            throw new ApiException(ErrorCode.NOT_FOUND, "Bản xem trước CSV đã hết hạn");
        }
        Map<Integer, Row> byNumber = new HashMap<>();
        snapshot.rows().forEach(row -> byNumber.put(row.rowNumber(), row));
        List<Row> rows = selected.stream().map(number -> {
            Row row = byNumber.get(number);
            if (row == null || !row.valid()) {
                throw new ApiException(ErrorCode.VALIDATION_FAILED, "rowNumbers",
                        "Chỉ chọn dòng hợp lệ trong bản xem trước");
            }
            return row;
        }).toList();
        var checked = rules.evaluate(userId, deck.getId(), rows);
        if (checked.stream().anyMatch(row -> !row.valid())) {
            throw new ApiException(ErrorCode.CONFLICT, "nhanIds",
                    "Nhãn đã thay đổi, hãy tạo bản xem trước mới");
        }
        List<Long> inserted = new ArrayList<>();
        for (Row row : checked) {
            var data = mapper.toRequest(row.data());
            var card = cards.saveAndFlush(TheTuVung.builder().boTheId(deck.getId())
                    .tu(data.tu()).tuLoai(CardText.nullable(data.tuLoai()))
                    .nghiaVi(data.nghiaVi()).phienAm(CardText.nullable(data.phienAm()))
                    .viDuEn(CardText.nullable(data.viDuEn())).dichVi(CardText.nullable(data.dichVi()))
                    .doKho(data.doKho()).nguon(CardText.nullable(data.nguon())).build());
            links.replaceTags(card.getId(), data.nhanIds().stream().map(Long::valueOf).toList(), clock.instant());
            inserted.add(card.getId());
        }
        var finalRows = rules.evaluate(userId, deck.getId(), checked);
        List<CsvCommitResponse.ResultItem> results = new ArrayList<>();
        for (int index = 0; index < finalRows.size(); index++) {
            var row = finalRows.get(index);
            String id = inserted.get(index).toString();
            var duplicates = row.theTrungIds().stream().filter(value -> !value.equals(id)).toList();
            results.add(new CsvCommitResponse.ResultItem(row.rowNumber(), id,
                    !duplicates.isEmpty() || !row.dongTrungNumbers().isEmpty(),
                    duplicates, row.dongTrungNumbers()));
        }
        var response = new CsvCommitResponse(snapshot.importId(), deck.getId().toString(),
                results.size(), List.copyOf(results));
        requests.complete(entry.id(), json.writeValueAsString(response), clock.instant());
        return response;
    }

    private CsvCommitResponse replay(CsvImportRequestRepository.Entry entry, String importId, String hash) {
        checkRequest(entry, importId, hash);
        if (!entry.completed() || entry.responseJson() == null) {
            throw new IllegalStateException("Committed CSV request is incomplete");
        }
        var response = json.readValue(entry.responseJson(), CsvCommitResponse.class);
        if (!importId.equals(response.importId()) || !entry.deckId().toString().equals(response.boTheId())) {
            throw new IllegalStateException("CSV response snapshot is inconsistent");
        }
        return response;
    }

    private void checkRequest(CsvImportRequestRepository.Entry entry, String importId, String hash) {
        if (!entry.importId().equals(importId) || !entry.hash().equals(hash)) {
            throw new ApiException(ErrorCode.CONFLICT, "Idempotency-Key",
                    "Idempotency-Key đã dùng cho yêu cầu khác");
        }
    }
}
