package com.do_an_tot_nghiep.k28.content.service;

import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.exception.ErrorResponse.FieldErrorItem;
import com.do_an_tot_nghiep.k28.content.dto.CsvMappingRequest;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class CsvImportParser {

    public static final int MAX_FILE_BYTES = 1_048_576;
    public static final int MAX_ROWS = 1000;

    public static final List<String> FIELDS = List.of(
            "tu", "tuLoai", "nghiaVi", "phienAm",
            "viDuEn", "dichVi", "doKho", "nguon", "nhanIds"
    );

    private static final CSVFormat FORMAT = CSVFormat.RFC4180.builder()
            .setIgnoreEmptyLines(false)
            .build();

    public ParsedFile parse(MultipartFile file, CsvMappingRequest mapping) {
        String text = readUtf8(file);

        try (CSVParser parser = CSVParser.parse(text, FORMAT)) {
            var iterator = parser.iterator();

            if (!iterator.hasNext()) {
                throw invalid("file", "Tệp CSV không có header");
            }

            List<String> headers = readHeaders(iterator.next());
            Map<String, Integer> columns = resolveColumns(headers, mapping);
            List<String> ignored = headers.stream()
                    .filter(header -> !columns.containsValue(headers.indexOf(header)))
                    .toList();

            List<ParsedRow> rows = new ArrayList<>();

            while (iterator.hasNext()) {
                if (rows.size() == MAX_ROWS) {
                    throw invalid("file", "CSV chỉ được chứa tối đa 1000 dòng dữ liệu");
                }

                CSVRecord record = iterator.next();
                Map<String, String> values = new LinkedHashMap<>();

                for (String field : FIELDS) {
                    Integer index = columns.get(field);
                    String value = index == null || index >= record.size()
                            ? ""
                            : record.get(index);
                    values.put(field, value);
                }

                List<FieldErrorItem> errors = record.size() == headers.size()
                        ? List.of()
                        : List.of(new FieldErrorItem(
                        "row",
                        "Số ô của dòng không khớp header: cần "
                                + headers.size() + ", nhận " + record.size()
                ));

                rows.add(new ParsedRow(
                        rows.size() + 1,
                        Map.copyOf(values),
                        errors
                ));
            }

            if (rows.isEmpty()) {
                throw invalid("file", "CSV phải có ít nhất một dòng dữ liệu");
            }

            return new ParsedFile(ignored, List.copyOf(rows));
        } catch (IOException | UncheckedIOException ex) {
            throw invalid("file", "CSV sai cấu trúc, hãy kiểm tra dấu ngoặc kép và xuống dòng");
        }
    }

    private String readUtf8(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw invalid("file", "Chọn tệp CSV có dữ liệu");
        }

        if (file.getSize() > MAX_FILE_BYTES) {
            throw invalid("file", "Tệp CSV không được vượt quá 1 MB");
        }

        try (var input = file.getInputStream()) {
            byte[] bytes = input.readNBytes(MAX_FILE_BYTES + 1);

            if (bytes.length > MAX_FILE_BYTES) {
                throw invalid("file", "Tệp CSV không được vượt quá 1 MB");
            }

            String text = StandardCharsets.UTF_8.newDecoder()
                    .onMalformedInput(CodingErrorAction.REPORT)
                    .onUnmappableCharacter(CodingErrorAction.REPORT)
                    .decode(ByteBuffer.wrap(bytes))
                    .toString();

            return text.startsWith("\uFEFF") ? text.substring(1) : text;
        } catch (CharacterCodingException ex) {
            throw invalid("file", "Tệp CSV phải dùng mã hóa UTF-8");
        } catch (IOException ex) {
            throw invalid("file", "Không đọc được tệp CSV, vui lòng chọn lại");
        }
    }

    private List<String> readHeaders(CSVRecord record) {
        List<String> headers = new ArrayList<>();
        HashSet<String> seen = new HashSet<>();

        for (String header : record) {
            if (header.isBlank() || header.length() > 200) {
                throw invalid("file", "Header phải có tên và không vượt quá 200 ký tự");
            }

            if (!seen.add(header)) {
                throw invalid("file", "Header bị trùng: " + header);
            }

            headers.add(header);
        }

        return List.copyOf(headers);
    }

    private Map<String, Integer> resolveColumns(
            List<String> headers,
            CsvMappingRequest mapping
    ) {
        Map<String, String> selected = new LinkedHashMap<>();

        if (mapping == null) {
            for (String header : headers) {
                if (!FIELDS.contains(header)) {
                    throw invalid("mapping", "Cột chưa hỗ trợ: " + header + ". Hãy ánh xạ cột");
                }
                selected.put(header, header);
            }
        } else {
            if (mapping.columns() == null
                    || mapping.columns().size() < 2
                    || mapping.columns().size() > FIELDS.size()) {
                throw invalid("mapping", "Ánh xạ từ 2 đến 9 cột");
            }

            for (var entry : mapping.columns().entrySet()) {
                String field = entry.getKey();
                String header = entry.getValue();

                if (field == null || !FIELDS.contains(field)) {
                    throw invalid("mapping", "Trường đích không được hỗ trợ");
                }
                if (header == null || !headers.contains(header)) {
                    throw invalid("mapping", "Header được ánh xạ không tồn tại");
                }

                selected.put(field, header);
            }
        }

        if (!selected.containsKey("tu") || !selected.containsKey("nghiaVi")) {
            throw invalid("mapping", "CSV phải có cột từ và nghĩa tiếng Việt");
        }

        if (new HashSet<>(selected.values()).size() != selected.size()) {
            throw invalid("mapping", "Không dùng một cột nguồn cho nhiều trường đích");
        }

        Map<String, Integer> columns = new LinkedHashMap<>();
        selected.forEach((field, header) -> columns.put(field, headers.indexOf(header)));
        return Map.copyOf(columns);
    }

    private ApiException invalid(String field, String message) {
        return new ApiException(ErrorCode.VALIDATION_FAILED, field, message);
    }

    public record ParsedFile(
            List<String> ignoredColumns,
            List<ParsedRow> rows
    ) {
    }

    public record ParsedRow(
            int rowNumber,
            Map<String, String> rawValues,
            List<FieldErrorItem> fieldErrors
    ) {
    }
}
