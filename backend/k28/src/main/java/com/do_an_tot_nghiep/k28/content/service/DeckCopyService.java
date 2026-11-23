package com.do_an_tot_nghiep.k28.content.service;

import com.do_an_tot_nghiep.k28.account.service.AccountService;
import com.do_an_tot_nghiep.k28.billing.service.EntitlementService;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.storage.StorageService;
import com.do_an_tot_nghiep.k28.content.dto.DeckResponse;
import com.do_an_tot_nghiep.k28.content.dto.OwnCopyResponse;
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
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.node.ObjectNode;

@Service
@RequiredArgsConstructor
public class DeckCopyService {

    private static final Pattern KEY = Pattern.compile("[A-Za-z0-9._:-]{1,128}");
    private final BoTheRepository decks;
    private final AccountService accountService;
    private final TheTuVungRepository cards;
    private final CardLinkRepository links;
    private final TepTinRepository files;
    private final StorageService storage;
    private final DeckCopyRequestRepository requests;
    private final DeckMapper mapper;
    private final CopyInfoService copyInfo;
    private final JsonMapper json;
    private final Clock clock;
    private final CardLimitService limits;
    private final EntitlementService entitlements;

    @Transactional(readOnly = true)
    public List<OwnCopyResponse> ownCopies(Long userId, List<Long> sourceIds) {
        return decks.findOwnCopies(userId, sourceIds.stream().distinct().toList()).stream()
                .map(link -> new OwnCopyResponse(
                        link.getBoNguonId().toString(),
                        link.getBoTheId().toString()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public boolean ownsDeck(Long userId, Long deckId) {
        return decks.findByIdAndChuSoHuuIdAndXoaAtIsNull(deckId, userId).isPresent();
    }

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

        BoThe source = decks.findForUpdate(sourceId).filter(found -> found.getXoaAt() == null).orElse(null);
        if (source == null || source.getQuyenTruyCap() != QuyenTruyCap.CONG_KHAI
                || source.getTrangThaiKiemDuyet() != TrangThaiKiemDuyet.BINH_THUONG
                || accountService.isUnavailable(source.getChuSoHuuId())) {
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

        if (userId.equals(source.getChuSoHuuId())) {
            throw new ApiException(ErrorCode.BUSINESS_RULE, "Đây là bộ của bạn, không cần sao chép",
                    Map.of("lyDo", "BO_CUA_BAN", "boTheId", source.getId().toString()));
        }
        if (source.getBoNguonId() != null) {
            throw new ApiException(ErrorCode.BUSINESS_RULE, "Đây là bản sao, hãy sao chép bộ gốc",
                    Map.of("lyDo", "LA_BAN_SAO", "boGocId", source.getBoNguonId().toString()));
        }
        decks.findFirstByChuSoHuuIdAndBoNguonIdAndXoaAtIsNullOrderByIdDesc(userId, sourceId).ifPresent(existing -> {
            throw new ApiException(ErrorCode.CONFLICT, "Bạn đã có bản sao của bộ này",
                    Map.of("boTheId", existing.getId().toString()));
        });
        if (source.isCaoCap()) {
            entitlements.requirePremiumSamples(userId);
        }
        List<TheTuVung> originals = cards.findAllForCopy(sourceId);
        limits.requireCapacity(userId, originals.size());
        List<Long> originalIds = originals.stream().map(TheTuVung::getId).toList();
        var tagLinks = links.findTags(originalIds).stream()
                .collect(Collectors.groupingBy(CardLinkRepository.TagLink::theId));
        var allFiles = links.findFiles(originalIds);
        Map<Long, TepTin> sourceFiles = validateSourceFiles(allFiles);
        var fileLinks = allFiles.stream()
                .collect(Collectors.groupingBy(CardLinkRepository.FileLink::theId));

        BoThe result = decks.saveAndFlush(BoThe.createCopy(userId, source));
        Instant now = clock.instant();
        Map<Long, Long> copiedFiles = copyFiles(userId, sourceFiles, now);
        for (TheTuVung original : originals) {
            TheTuVung copied = cards.saveAndFlush(TheTuVung.createCopy(result.getId(), original));
            links.replaceTags(copied.getId(), tagLinks.getOrDefault(original.getId(), List.of())
                    .stream().map(CardLinkRepository.TagLink::nhanId).toList(), now);
            links.replaceFiles(copied.getId(), fileLinks.getOrDefault(original.getId(), List.of())
                    .stream().map(link -> new CardLinkRepository.FileSelection(
                            copiedFiles.get(link.tepId()), link.vaiTro()))
                    .toList(), now);
        }

        DeckResponse response = mapper.toResponse(result, false, originals.size(),
                copyInfo.origins(List.of(result)).get(result.getId()), null);
        requests.complete(reservation.id(), result.getId(), json.writeValueAsString(response), clock.instant());
        return response;
    }

    private Map<Long, Long> copyFiles(Long userId, Map<Long, TepTin> sourceFiles, Instant now) {
        Map<Long, Long> copied = new TreeMap<>();
        sourceFiles.forEach((id, source) -> {
            String key = storage.newObjectKey("files/" + userId);
            storage.copy(source.getObjectKey(), key);
            copied.put(id, files.save(TepTin.copyOf(source, userId, key, now)).getId());
        });
        return copied;
    }

    private Map<Long, TepTin> validateSourceFiles(List<CardLinkRepository.FileLink> selections) {
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
        return locked;
    }

    private DeckResponse replay(Long userId, Long sourceId, DeckCopyRequestRepository.Entry entry) {
        if (!sourceId.equals(entry.sourceId())) {
            throw keyConflict();
        }
        if (!entry.completed() || entry.resultId() == null || entry.responseJson() == null) {
            throw new IllegalStateException("Committed copy request is incomplete");
        }
        JsonNode snapshot = json.readTree(entry.responseJson());
        if (!snapshot.has("soThe") && snapshot instanceof ObjectNode legacy) {
            legacy.put("soThe", cards.countActiveByDeckId(List.of(entry.resultId())).stream()
                    .mapToLong(TheTuVungRepository.DeckCardCount::getSoThe).sum());
        }
        DeckResponse response = json.treeToValue(snapshot, DeckResponse.class);
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
