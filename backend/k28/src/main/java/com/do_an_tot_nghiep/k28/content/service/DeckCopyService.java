package com.do_an_tot_nghiep.k28.content.service;

import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.content.dto.DeckResponse;
import com.do_an_tot_nghiep.k28.content.entity.BoThe;
import com.do_an_tot_nghiep.k28.content.entity.TepTin;
import com.do_an_tot_nghiep.k28.content.entity.TheTuVung;
import com.do_an_tot_nghiep.k28.content.entity.enums.LoaiTep;
import com.do_an_tot_nghiep.k28.content.entity.enums.QuyenTruyCap;
import com.do_an_tot_nghiep.k28.content.entity.enums.TrangThaiKiemDuyet;
import com.do_an_tot_nghiep.k28.content.entity.enums.TrangThaiXoaTep;
import com.do_an_tot_nghiep.k28.content.entity.enums.VaiTroTep;
import com.do_an_tot_nghiep.k28.content.mapper.DeckMapper;
import com.do_an_tot_nghiep.k28.content.repository.BoTheRepository;
import com.do_an_tot_nghiep.k28.content.repository.CardLinkRepository;
import com.do_an_tot_nghiep.k28.content.repository.DeckCopyRequestRepository;
import com.do_an_tot_nghiep.k28.content.repository.TepTinRepository;
import com.do_an_tot_nghiep.k28.content.repository.TheTuVungRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

@Service
@RequiredArgsConstructor
public class DeckCopyService {

    private static final Pattern KEY = Pattern.compile("[A-Za-z0-9._:-]{1,128}");
    private final BoTheRepository decks;
    private final TheTuVungRepository cards;
    private final CardLinkRepository links;
    private final TepTinRepository files;
    private final DeckCopyRequestRepository requests;
    private final DeckMapper mapper;
    private final JsonMapper json;
    private final Clock clock;

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public DeckResponse copy(Long userId, Long sourceId, String key) {
        if (sourceId == null || sourceId <= 0) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "id", "ID bộ thẻ phải là số nguyên dương");
        }
        if (key == null || !KEY.matcher(key).matches()) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "Idempotency-Key",
                    "Gửi key từ 1 đến 128 ký tự: chữ, số, dấu chấm, gạch dưới, gạch ngang hoặc dấu hai chấm");
        }

        var previous = requests.find(userId, key);
        if (previous.isPresent()) {
            return replay(userId, sourceId, previous.get());
        }

        BoThe source = decks.findByIdAndXoaAtIsNull(sourceId).orElse(null);
        if (source == null || source.getQuyenTruyCap() != QuyenTruyCap.CONG_KHAI
                || source.getTrangThaiKiemDuyet() != TrangThaiKiemDuyet.BINH_THUONG) {
            var completedMeanwhile = requests.find(userId, key);
            if (completedMeanwhile.isPresent()) {
                return replay(userId, sourceId, completedMeanwhile.get());
            }
            throw new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy bộ thẻ công khai");
        }

        var reservation = requests.reserveAndLock(userId, key, sourceId, clock.instant());
        if (!sourceId.equals(reservation.sourceId())) {
            throw keyConflict();
        }
        if (reservation.completed()) {
            return replay(userId, sourceId, reservation);
        }

        List<TheTuVung> originals = cards.findAllForCopy(sourceId);
        List<Long> originalIds = originals.stream().map(TheTuVung::getId).toList();
        var tagLinks = links.findTags(originalIds).stream()
                .collect(Collectors.groupingBy(CardLinkRepository.TagLink::theId));
        var allFiles = links.findFiles(originalIds);
        validateSourceFiles(allFiles);
        var fileLinks = allFiles.stream()
                .collect(Collectors.groupingBy(CardLinkRepository.FileLink::theId));

        BoThe result = decks.saveAndFlush(BoThe.createCopy(userId, source));
        Instant now = clock.instant();
        for (TheTuVung original : originals) {
            TheTuVung copied = cards.saveAndFlush(TheTuVung.createCopy(result.getId(), original));
            links.replaceTags(copied.getId(), tagLinks.getOrDefault(original.getId(), List.of())
                    .stream().map(CardLinkRepository.TagLink::nhanId).toList(), now);
            links.replaceFiles(copied.getId(), fileLinks.getOrDefault(original.getId(), List.of())
                    .stream().map(link -> new CardLinkRepository.FileSelection(link.tepId(), link.vaiTro()))
                    .toList(), now);
        }

        DeckResponse response = mapper.toResponse(result, false);
        requests.complete(reservation.id(), result.getId(), json.writeValueAsString(response), clock.instant());
        return response;
    }

    private void validateSourceFiles(List<CardLinkRepository.FileLink> selections) {
        Map<Long, TepTin> locked = new TreeMap<>();
        for (Long id : selections.stream().map(CardLinkRepository.FileLink::tepId).distinct().sorted().toList()) {
            TepTin file = files.findForCopy(id).orElseThrow(this::invalidSourceFile);
            if (file.getHoanTatAt() == null || file.getXoaAt() != null
                    || file.getTrangThaiXoa() != TrangThaiXoaTep.CON_HIEU_LUC) {
                throw invalidSourceFile();
            }
            locked.put(id, file);
        }
        for (var selection : selections) {
            LoaiTep expected = selection.vaiTro() == VaiTroTep.ANH ? LoaiTep.ANH : LoaiTep.AM_THANH;
            if (locked.get(selection.tepId()).getLoai() != expected) {
                throw invalidSourceFile();
            }
        }
    }

    private DeckResponse replay(Long userId, Long sourceId, DeckCopyRequestRepository.Entry entry) {
        if (!sourceId.equals(entry.sourceId())) {
            throw keyConflict();
        }
        if (!entry.completed() || entry.resultId() == null || entry.responseJson() == null) {
            throw new IllegalStateException("Committed copy request is incomplete");
        }
        DeckResponse response = json.readValue(entry.responseJson(), DeckResponse.class);
        if (!entry.resultId().toString().equals(response.id())
                || !sourceId.toString().equals(response.boNguonId())
                || !userId.toString().equals(response.chuSoHuuId())) {
            throw new IllegalStateException("Copy response snapshot is inconsistent");
        }
        return response;
    }

    private ApiException keyConflict() {
        return new ApiException(ErrorCode.CONFLICT, "Idempotency-Key", "Key này đã dùng cho một bộ nguồn khác");
    }

    private ApiException invalidSourceFile() {
        return new ApiException(ErrorCode.BUSINESS_RULE, "Bộ nguồn có tệp không hợp lệ, vui lòng chọn bộ khác");
    }
}
