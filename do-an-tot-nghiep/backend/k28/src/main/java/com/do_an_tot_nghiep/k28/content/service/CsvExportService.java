package com.do_an_tot_nghiep.k28.content.service;

import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.content.repository.BoTheRepository;
import com.do_an_tot_nghiep.k28.content.repository.CardLinkRepository;
import com.do_an_tot_nghiep.k28.content.repository.TheTuVungRepository;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.io.IOException;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class CsvExportService {
    private final BoTheRepository decks;
    private final TheTuVungRepository cards;
    private final CardLinkRepository links;

    @Transactional(readOnly = true)
    public byte[] export(Long userId, Long deckId) {
        var deck = decks.findByIdAndXoaAtIsNull(deckId)
                .filter(value -> userId.equals(value.getChuSoHuuId()))
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy bộ thẻ"));
        StringWriter writer = new StringWriter();
        writer.write('\uFEFF');
        try (CSVPrinter printer = new CSVPrinter(writer, CSVFormat.RFC4180)) {
            printer.printRecord(CsvImportParser.FIELDS);
            int page = 0;
            while (true) {
                var batch = cards.findByBoTheIdAndXoaAtIsNullOrderByIdAsc(deck.getId(),
                        PageRequest.of(page++, 500, Sort.unsorted()));
                Map<Long, List<String>> tagIds = new HashMap<>();
                links.findTags(batch.stream().map(card -> card.getId()).toList())
                        .forEach(link -> tagIds.computeIfAbsent(link.theId(), n -> new ArrayList<>())
                                .add(link.nhanId().toString()));
                for (var card : batch) {
                    printer.printRecord(safeCell(card.getTu()), safeCell(card.getTuLoai()),
                            safeCell(card.getNghiaVi()), safeCell(card.getPhienAm()),
                            safeCell(card.getViDuEn()), safeCell(card.getDichVi()), card.getDoKho(),
                            safeCell(card.getNguon()), String.join(";", tagIds.getOrDefault(card.getId(), List.of())));
                }
                if (!batch.hasNext()) {
                    break;
                }
            }
        } catch (IOException ex) {
            throw new IllegalStateException("Cannot export CSV", ex);
        }
        return writer.toString().getBytes(StandardCharsets.UTF_8);
    }

    public static String safeCell(String value) {
        if (value == null || value.isEmpty()) {
            return "";
        }
        int index = 0;
        while (index < value.length()) {
            int point = value.codePointAt(index);
            if (!Character.isWhitespace(point) && !Character.isSpaceChar(point)
                    && !Character.isISOControl(point) && Character.getType(point) != Character.FORMAT) {
                break;
            }
            index += Character.charCount(point);
        }
        if (index < value.length() && "=+-@＝＋－＠".indexOf(value.charAt(index)) >= 0) {
            return "'" + value;
        }
        if (value.charAt(0) == '\t' || value.charAt(0) == '\r' || value.charAt(0) == '\n') {
            return "'" + value;
        }
        return value;
    }
}
