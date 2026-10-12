package com.do_an_tot_nghiep.k28.content.service;

import com.do_an_tot_nghiep.k28.common.exception.ErrorResponse.FieldErrorItem;
import com.do_an_tot_nghiep.k28.content.dto.CreateCardRequest;
import com.do_an_tot_nghiep.k28.content.dto.CsvPreviewResponse.Row;
import com.do_an_tot_nghiep.k28.content.mapper.CsvMapper;
import com.do_an_tot_nghiep.k28.content.service.CsvImportParser.ParsedRow;
import jakarta.validation.Validator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class CsvRowValidator {

    private final Validator validator;
    private final CsvMapper mapper;

    public Row validate(ParsedRow parsed) {
        Map<String, String> raw = parsed.rawValues();
        List<FieldErrorItem> errors = new ArrayList<>(parsed.fieldErrors());

        raw.forEach((field, value) -> {
            if (value.indexOf('\0') >= 0) {
                errors.add(new FieldErrorItem(
                        field,
                        "Nội dung không được chứa ký tự NUL"
                ));
            }
        });

        Integer difficulty = parseDifficulty(raw.get("doKho"), errors);
        List<String> tagIds = parseTags(raw.get("nhanIds"), errors);

        CreateCardRequest request = new CreateCardRequest(
                raw.get("tu"),
                raw.get("tuLoai"),
                raw.get("nghiaVi"),
                raw.get("phienAm"),
                raw.get("viDuEn"),
                raw.get("dichVi"),
                difficulty,
                raw.get("nguon"),
                tagIds,
                null,
                null,
                null
        );

        validator.validate(request).forEach(violation -> {
            String field = violation.getPropertyPath()
                    .toString()
                    .replace(".<list element>", "");

            errors.add(new FieldErrorItem(
                    field,
                    violation.getMessage()
            ));
        });

        List<FieldErrorItem> orderedErrors = errors.stream()
                .distinct()
                .sorted(Comparator.comparing(FieldErrorItem::field)
                        .thenComparing(FieldErrorItem::message))
                .toList();

        return new Row(
                parsed.rowNumber(),
                raw,
                mapper.toData(request, difficulty),
                orderedErrors.isEmpty(),
                orderedErrors,
                false,
                List.of(),
                List.of()
        );
    }

    private Integer parseDifficulty(
            String raw,
            List<FieldErrorItem> errors
    ) {
        String value = CardText.text(raw);

        if (value == null || value.isBlank()) {
            return 1;
        }

        try {
            return Integer.valueOf(value);
        } catch (NumberFormatException ex) {
            errors.add(new FieldErrorItem(
                    "doKho",
                    "Độ khó phải là số nguyên từ 1 đến 5"
            ));
            return null;
        }
    }

    private List<String> parseTags(
            String raw,
            List<FieldErrorItem> errors
    ) {
        String value = CardText.text(raw);

        if (value == null || value.isBlank()) {
            return List.of();
        }

        List<String> ids = Arrays.stream(value.split(";", 101))
                .map(CardText::text)
                .toList();

        if (new HashSet<>(ids).size() != ids.size()) {
            errors.add(new FieldErrorItem(
                    "nhanIds",
                    "Không gửi ID nhãn trùng nhau"
            ));
        }

        return ids;
    }
}