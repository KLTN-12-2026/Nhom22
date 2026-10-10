package com.do_an_tot_nghiep.k28.content.service;

import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import com.do_an_tot_nghiep.k28.content.dto.CardResponse;
import com.do_an_tot_nghiep.k28.content.dto.CreateCardRequest;
import com.do_an_tot_nghiep.k28.content.dto.UpdateCardRequest;
import com.do_an_tot_nghiep.k28.content.entity.BoThe;
import com.do_an_tot_nghiep.k28.content.entity.TepTin;
import com.do_an_tot_nghiep.k28.content.entity.TheTuVung;
import com.do_an_tot_nghiep.k28.content.entity.enums.LoaiTep;
import com.do_an_tot_nghiep.k28.content.entity.enums.TrangThaiXoaTep;
import com.do_an_tot_nghiep.k28.content.entity.enums.VaiTroTep;
import com.do_an_tot_nghiep.k28.content.mapper.CardMapper;
import com.do_an_tot_nghiep.k28.content.repository.BoTheRepository;
import com.do_an_tot_nghiep.k28.content.repository.CardLinkRepository;
import com.do_an_tot_nghiep.k28.content.repository.CardLinkRepository.FileSelection;
import com.do_an_tot_nghiep.k28.content.repository.NhanRepository;
import com.do_an_tot_nghiep.k28.content.repository.TepTinRepository;
import com.do_an_tot_nghiep.k28.content.repository.TheTuVungRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;

import java.time.Clock;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CardService {

    private final TheTuVungRepository cards;
    private final BoTheRepository decks;
    private final NhanRepository tags;
    private final TepTinRepository files;
    private final CardLinkRepository links;
    private final CardMapper mapper;
    private final EntityManager entityManager;
    private final Clock clock;

    public PageResponse<CardResponse> list(
            Long userId,
            Long deckId,
            int page,
            int size
    ) {
        BoThe deck = ownedDeck(userId, deckId);

        if (page < 0 || size < 1 || size > 100) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    "page phải không âm, size từ 1 đến 100"
            );
        }

        Page<TheTuVung> result =
                cards.findByBoTheIdAndXoaAtIsNullOrderByIdDesc(
                        deck.getId(), PageRequest.of(page, size)
                );

        if (result.isEmpty()) {
            return PageResponse.of(
                    result.map(card -> toResponse(card))
            );
        }

        List<Long> cardIds = result.getContent().stream()
                .map(TheTuVung::getId)
                .toList();

        Map<Long, List<String>> tagsByCard =
                links.findTags(cardIds).stream()
                        .collect(Collectors.groupingBy(
                                CardLinkRepository.TagLink::theId,
                                Collectors.mapping(
                                        link -> link.nhanId().toString(),
                                        Collectors.toList()
                                )
                        ));

        Map<Long, List<CardLinkRepository.FileLink>> filesByCard =
                links.findFiles(cardIds).stream()
                        .collect(Collectors.groupingBy(
                                CardLinkRepository.FileLink::theId
                        ));

        Map<CardText.DuplicateKey, List<Long>> duplicateGroups =
                cards.findDuplicateCandidates(deck.getId()).stream()
                        .collect(Collectors.groupingBy(
                                candidate -> CardText.duplicateKey(
                                        candidate.getTu(),
                                        candidate.getTuLoai()
                                ),
                                Collectors.mapping(
                                        TheTuVungRepository.DuplicateCandidate::getId,
                                        Collectors.toList()
                                )
                        ));

        return PageResponse.of(result.map(card -> {
            List<String> tagIds = tagsByCard.getOrDefault(
                    card.getId(), List.of()
            );

            List<CardLinkRepository.FileLink> fileLinks = filesByCard.getOrDefault(
                    card.getId(), List.of()
            );

            CardText.DuplicateKey key = CardText.duplicateKey(
                    card.getTu(), card.getTuLoai()
            );

            List<String> duplicates = duplicateGroups
                    .getOrDefault(key, List.of())
                    .stream()
                    .filter(id -> !Objects.equals(id, card.getId()))
                    .map(String::valueOf)
                    .toList();

            return mapper.toResponse(
                    card,
                    tagIds,
                    fileId(fileLinks, VaiTroTep.ANH),
                    fileId(fileLinks, VaiTroTep.AM_TU),
                    fileId(fileLinks, VaiTroTep.AM_CAU),
                    !duplicates.isEmpty(),
                    duplicates
            );
        }));
    }

    @Transactional
    public CardResponse create(Long userId, Long deckId, CreateCardRequest request) {
        BoThe deck = writableDeck(userId, deckId);

        List<Long> tagIds = validatedTagIds(request.nhanIds());
        List<FileSelection> selections = createFileSelections(request);

        validateFiles(userId, selections);

        TheTuVung card = TheTuVung.builder()
                .boTheId(deck.getId())
                .tu(request.tu())
                .tuLoai(CardText.nullable(request.tuLoai()))
                .nghiaVi(request.nghiaVi())
                .phienAm(CardText.nullable(request.phienAm()))
                .viDuEn(CardText.nullable(request.viDuEn()))
                .dichVi(CardText.nullable(request.dichVi()))
                .doKho(request.doKho())
                .nguon(CardText.nullable(request.nguon()))
                .build();

        card = cards.saveAndFlush(card);

        Instant now = clock.instant();

        links.replaceTags(card.getId(), tagIds, now);
        links.replaceFiles(card.getId(), selections, now);

        return toResponse(card);

    }

    @Transactional
    public CardResponse update(Long userId, Long cardId, UpdateCardRequest request) {
        TheTuVung card = ownedCardForUpdate(userId, cardId);
        checkVersion(card, request.version());

        List<Long> tagIds = request.nhanIds() == null ? null :
                validatedTagIds(request.nhanIds());

        boolean changeFiles = hasFileChanges(request);

        List<FileSelection> selections = changeFiles ? updatedFileSelections(cardId, request)
                : List.of();

        if (changeFiles) {
            Map<VaiTroTep, Long> retained = new EnumMap<>(VaiTroTep.class);
            links.findFiles(List.of(cardId)).forEach(link -> retained.put(link.vaiTro(), link.tepId()));
            validateFiles(userId, selections, retained);
        }

        applyDetails(card, request);

        Instant now = clock.instant();

        if (tagIds != null) {
            links.replaceTags(cardId, tagIds, now);
        }

        if (changeFiles) {
            links.replaceFiles(cardId, selections, now);
        }

        cards.flush();

        if (Objects.equals(card.getVersion(), request.version())) {
            int affected = cards.touchVersion(
                    cardId, request.version(), now
            );

            if (affected != 1) {
                throw new ApiException(
                        ErrorCode.VERSION_CONFLICT,
                        "Thẻ đã thay đổi, vui lòng tải lại"
                );
            }

            card = cards.findByIdAndXoaAtIsNull(cardId)
                    .orElseThrow(this::cardNotFound);
        }

        return toResponse(card);
    }

    @Transactional
    public void delete(Long userId, Long cardId, Long version) {
        TheTuVung card = ownedCardForUpdate(userId, cardId);
        checkVersion(card, version);

        card.markDeleted(clock.instant());
        cards.flush();
    }

    private void applyDetails(
            TheTuVung card,
            UpdateCardRequest request
    ) {
        card.updateDetails(
                request.tu() == null
                        ? card.getTu()
                        : request.tu(),
                optionalValue(request.tuLoai(), card.getTuLoai()),
                request.nghiaVi() == null
                        ? card.getNghiaVi()
                        : request.nghiaVi(),
                optionalValue(request.phienAm(), card.getPhienAm()),
                optionalValue(request.viDuEn(), card.getViDuEn()),
                optionalValue(request.dichVi(), card.getDichVi()),
                request.doKho() == null
                        ? card.getDoKho()
                        : request.doKho(),
                optionalValue(request.nguon(), card.getNguon())
        );
    }

    private String optionalValue(
            String requested,
            String current
    ) {
        return requested == null
                ? current
                : CardText.nullable(requested);
    }

    private boolean hasFileChanges(UpdateCardRequest request) {
        return request.anhId() != null
                || request.boAnh()
                || request.amTuId() != null
                || request.boAmTu()
                || request.amCauId() != null
                || request.boAmCau();
    }

    private List<FileSelection> updatedFileSelections(
            Long cardId,
            UpdateCardRequest request
    ) {
        Map<VaiTroTep, Long> selected = new EnumMap<>(
                VaiTroTep.class
        );

        for (CardLinkRepository.FileLink link : links.findFiles(List.of(cardId))) {
            selected.put(link.vaiTro(), link.tepId());
        }

        applyFileSelection(
                selected, VaiTroTep.ANH,
                request.anhId(), request.boAnh()
        );
        applyFileSelection(
                selected, VaiTroTep.AM_TU,
                request.amTuId(), request.boAmTu()
        );
        applyFileSelection(
                selected, VaiTroTep.AM_CAU,
                request.amCauId(), request.boAmCau()
        );

        return selected.entrySet().stream()
                .map(entry -> new FileSelection(
                        entry.getValue(), entry.getKey()
                ))
                .toList();
    }

    private void applyFileSelection(
            Map<VaiTroTep, Long> selected,
            VaiTroTep role,
            String fileId,
            boolean remove
    ) {
        if (remove) {
            selected.remove(role);
        } else if (fileId != null) {
            selected.put(role, Long.valueOf(fileId));
        }
    }

    private CardResponse toResponse(TheTuVung card) {
        List<Long> cardIds = List.of(card.getId());

        List<String> tagIds = links.findTags(cardIds).stream()
                .map(link -> link.nhanId().toString())
                .toList();

        List<CardLinkRepository.FileLink> fileLinks = links.findFiles(cardIds);

        List<String> duplicates = duplicateIds(
                card.getBoTheId(),
                card.getId(),
                card.getTu(),
                card.getTuLoai()
        );

        return mapper.toResponse(
                card,
                tagIds,
                fileId(fileLinks, VaiTroTep.ANH),
                fileId(fileLinks, VaiTroTep.AM_TU),
                fileId(fileLinks, VaiTroTep.AM_CAU),
                !duplicates.isEmpty(),
                duplicates
        );
    }

    private String fileId(
            List<CardLinkRepository.FileLink> fileLinks,
            VaiTroTep role
    ) {
        return fileLinks.stream()
                .filter(link -> link.vaiTro() == role)
                .map(link -> link.tepId().toString())
                .findFirst()
                .orElse(null);
    }

    private List<FileSelection> createFileSelections(
            CreateCardRequest request
    ) {
        List<FileSelection> selections = new ArrayList<>();

        addFileSelection(
                selections, request.anhId(), VaiTroTep.ANH
        );
        addFileSelection(
                selections, request.amTuId(), VaiTroTep.AM_TU
        );
        addFileSelection(
                selections, request.amCauId(), VaiTroTep.AM_CAU
        );

        return List.copyOf(selections);
    }

    private void addFileSelection(
            List<FileSelection> selections,
            String fileId,
            VaiTroTep role
    ) {
        if (fileId != null) {
            selections.add(new FileSelection(
                    Long.valueOf(fileId), role
            ));
        }
    }

    private BoThe ownedDeck(Long userId, Long deckId) {
        return decks.findByIdAndChuSoHuuIdAndXoaAtIsNull(
                deckId, userId
        ).orElseThrow(this::deckNotFound);
    }

    private BoThe writableDeck(Long userId, Long deckId) {
        return decks.findOwnedForUpdate(deckId, userId)
                .orElseThrow(this::deckNotFound);
    }

    private TheTuVung ownedCardForUpdate(
            Long userId,
            Long cardId
    ) {
        TheTuVung card = cards.findByIdAndXoaAtIsNull(cardId)
                .orElseThrow(this::cardNotFound);

        Long deckId = card.getBoTheId();
        writableDeck(userId, deckId);

        entityManager.refresh(
                card, LockModeType.PESSIMISTIC_WRITE
        );

        if (card.getXoaAt() != null
                || !Objects.equals(card.getBoTheId(), deckId)) {
            throw cardNotFound();
        }

        return card;
    }

    private void checkVersion(
            TheTuVung card,
            Long version
    ) {
        if (version == null || version < 0) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    "version",
                    "Gửi phiên bản không âm của thẻ"
            );
        }

        if (!Objects.equals(card.getVersion(), version)) {
            throw new ApiException(
                    ErrorCode.VERSION_CONFLICT,
                    "Thẻ đã thay đổi, vui lòng tải lại"
            );
        }
    }

    private List<Long> validatedTagIds(List<String> values) {
        List<Long> ids = values.stream()
                .map(Long::valueOf)
                .toList();

        if (new HashSet<>(ids).size() != ids.size()) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    "nhanIds",
                    "Không gửi ID nhãn trùng nhau"
            );
        }

        if (!ids.isEmpty()
                && tags.findAllById(ids).size() != ids.size()) {
            throw new ApiException(
                    ErrorCode.BUSINESS_RULE,
                    "nhanIds",
                    "Nhãn không còn tồn tại, vui lòng chọn lại"
            );
        }

        return ids.stream().sorted().toList();
    }

    private void validateFiles(
            Long userId,
            Collection<FileSelection> selections
    ) {
        validateFiles(userId, selections, Map.of());
    }

    private void validateFiles(
            Long userId,
            Collection<FileSelection> selections,
            Map<VaiTroTep, Long> retained
    ) {
        Map<Long, TepTin> lockedFiles = new TreeMap<>();

        List<Long> ids = selections.stream()
                .map(FileSelection::tepId)
                .distinct()
                .sorted()
                .toList();

        for (Long id : ids) {
            boolean newAttachment = selections.stream().anyMatch(selection -> id.equals(selection.tepId())
                    && !id.equals(retained.get(selection.vaiTro())));
            TepTin file = (newAttachment ? files.findOwnedForUpdate(id, userId) : files.findForCopy(id))
                    .orElseThrow(this::fileNotFound);

            entityManager.refresh(
                    file, newAttachment ? LockModeType.PESSIMISTIC_WRITE : LockModeType.PESSIMISTIC_READ
            );

            if ((newAttachment && !Objects.equals(file.getChuSoHuuId(), userId))
                    || file.getTrangThaiXoa() != TrangThaiXoaTep.CON_HIEU_LUC
                    || file.getXoaAt() != null) {
                throw fileNotFound();
            }

            if (file.getHoanTatAt() == null) {
                throw new ApiException(
                        ErrorCode.BUSINESS_RULE,
                        "Tệp chưa hoàn tất tải lên"
                );
            }

            lockedFiles.put(id, file);
        }

        for (FileSelection selection : selections) {
            LoaiTep expected = selection.vaiTro() == VaiTroTep.ANH
                    ? LoaiTep.ANH
                    : LoaiTep.AM_THANH;

            if (lockedFiles.get(selection.tepId()).getLoai()
                    != expected) {
                throw new ApiException(
                        ErrorCode.BUSINESS_RULE,
                        fileField(selection.vaiTro()),
                        expected == LoaiTep.ANH
                                ? "Chọn tệp ảnh đã hoàn tất"
                                : "Chọn tệp âm thanh đã hoàn tất"
                );
            }
        }
    }

    private List<String> duplicateIds(
            Long deckId,
            Long excludedCardId,
            String tu,
            String tuLoai
    ) {
        CardText.DuplicateKey key = CardText.duplicateKey(
                tu, tuLoai
        );

        return cards.findDuplicateCandidates(deckId).stream()
                .filter(candidate -> !Objects.equals(
                        candidate.getId(), excludedCardId
                ))
                .filter(candidate -> key.equals(
                        CardText.duplicateKey(
                                candidate.getTu(),
                                candidate.getTuLoai()
                        )
                ))
                .map(candidate -> candidate.getId().toString())
                .toList();
    }

    private String fileField(VaiTroTep role) {
        return switch (role) {
            case ANH -> "anhId";
            case AM_TU -> "amTuId";
            case AM_CAU -> "amCauId";
        };
    }

    private ApiException deckNotFound() {
        return new ApiException(
                ErrorCode.NOT_FOUND,
                "Không tìm thấy bộ thẻ"
        );
    }

    private ApiException cardNotFound() {
        return new ApiException(
                ErrorCode.NOT_FOUND,
                "Không tìm thấy thẻ từ vựng"
        );
    }

    private ApiException fileNotFound() {
        return new ApiException(
                ErrorCode.NOT_FOUND,
                "Không tìm thấy tệp"
        );
    }
}
