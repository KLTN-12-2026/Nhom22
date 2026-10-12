package com.do_an_tot_nghiep.k28.content.service;

import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.exception.ErrorResponse.FieldErrorItem;
import com.do_an_tot_nghiep.k28.content.dto.CsvPreviewResponse.Row;
import com.do_an_tot_nghiep.k28.content.repository.BoTheRepository;
import com.do_an_tot_nghiep.k28.content.repository.NhanRepository;
import com.do_an_tot_nghiep.k28.content.repository.TheTuVungRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CsvPreviewRulesService {

    private static final int TAG_BATCH_SIZE = 500;

    private final BoTheRepository decks;
    private final TheTuVungRepository cards;
    private final NhanRepository tags;

    public void requireOwnedDeck(Long userId, Long deckId) {
        decks.findByIdAndChuSoHuuIdAndXoaAtIsNull(deckId, userId)
                .orElseThrow(() -> new ApiException(
                        ErrorCode.NOT_FOUND,
                        "Không tìm thấy bộ thẻ"
                ));
    }

    public List<Row> evaluate(
            Long userId,
            Long deckId,
            List<Row> rows
    ) {
        requireOwnedDeck(userId, deckId);

        Set<Long> existingTagIds = findExistingTagIds(rows);
        List<Row> checkedRows = rows.stream()
                .map(row -> validateTags(row, existingTagIds))
                .toList();

        Map<CardText.DuplicateKey, List<String>> existingCards =
                new HashMap<>();

        for (var candidate : cards.findDuplicateCandidates(deckId)) {
            var key = CardText.duplicateKey(
                    candidate.getTu(),
                    candidate.getTuLoai()
            );

            existingCards.computeIfAbsent(
                    key, ignored -> new ArrayList<>()
            ).add(candidate.getId().toString());
        }

        Map<CardText.DuplicateKey, List<Integer>> fileRows =
                new HashMap<>();

        for (Row row : checkedRows) {
            if (row.valid()) {
                fileRows.computeIfAbsent(
                        duplicateKey(row),
                        ignored -> new ArrayList<>()
                ).add(row.rowNumber());
            }
        }

        return checkedRows.stream()
                .map(row -> addDuplicateWarnings(
                        row, existingCards, fileRows
                ))
                .toList();
    }

    private Set<Long> findExistingTagIds(List<Row> rows) {
        List<Long> requestedIds = rows.stream()
                .filter(Row::valid)
                .flatMap(row -> row.data().nhanIds().stream())
                .map(Long::valueOf)
                .distinct()
                .toList();

        Set<Long> existingIds = new HashSet<>();

        for (int start = 0; start < requestedIds.size();
             start += TAG_BATCH_SIZE) {
            int end = Math.min(
                    start + TAG_BATCH_SIZE,
                    requestedIds.size()
            );

            tags.findAllById(requestedIds.subList(start, end))
                    .forEach(tag -> existingIds.add(tag.getId()));
        }

        return existingIds;
    }

    private Row validateTags(Row row, Set<Long> existingIds) {
        if (!row.valid()) {
            return row;
        }

        List<FieldErrorItem> errors =
                new ArrayList<>(row.fieldErrors());

        List<String> tagIds = row.data().nhanIds();

        for (int index = 0; index < tagIds.size(); index++) {
            if (!existingIds.contains(
                    Long.valueOf(tagIds.get(index))
            )) {
                errors.add(new FieldErrorItem(
                        "nhanIds[" + index + "]",
                        "Nhãn không tồn tại"
                ));
            }
        }

        return new Row(
                row.rowNumber(),
                row.rawValues(),
                row.data(),
                errors.isEmpty(),
                List.copyOf(errors),
                false,
                List.of(),
                List.of()
        );
    }

    private Row addDuplicateWarnings(
            Row row,
            Map<CardText.DuplicateKey, List<String>> existingCards,
            Map<CardText.DuplicateKey, List<Integer>> fileRows
    ) {
        if (!row.valid()) {
            return row;
        }

        var key = duplicateKey(row);

        List<String> cardIds = List.copyOf(
                existingCards.getOrDefault(key, List.of())
        );

        List<Integer> duplicateRows = fileRows
                .getOrDefault(key, List.of())
                .stream()
                .filter(number -> number != row.rowNumber())
                .toList();

        return new Row(
                row.rowNumber(),
                row.rawValues(),
                row.data(),
                true,
                row.fieldErrors(),
                !cardIds.isEmpty() || !duplicateRows.isEmpty(),
                cardIds,
                duplicateRows
        );
    }

    private CardText.DuplicateKey duplicateKey(Row row) {
        return CardText.duplicateKey(
                row.data().tu(),
                row.data().tuLoai()
        );
    }
}