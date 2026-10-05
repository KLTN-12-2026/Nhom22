package com.do_an_tot_nghiep.k28.content.service;

import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
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

import lombok.RequiredArgsConstructor;
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

//    public CardResponse uddate(Long userId, Long cardId, UpdateCardRequest request) {
//        TheTuVung card = ownedCardForUpdate(userId, cardId);
//        checkVersion(card, request.version());
//
//        List<Long> tagIds = request.nhanIds() == null ? null :
//                validatedTagIds(request.nhanIds())
//
//
//
//        return toResponse(card);
//    }

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
        Map<Long, TepTin> lockedFiles = new TreeMap<>();

        List<Long> ids = selections.stream()
                .map(FileSelection::tepId)
                .distinct()
                .sorted()
                .toList();

        for (Long id : ids) {
            TepTin file = files.findOwnedForUpdate(id, userId)
                    .orElseThrow(this::fileNotFound);

            entityManager.refresh(
                    file, LockModeType.PESSIMISTIC_WRITE
            );

            if (!Objects.equals(file.getChuSoHuuId(), userId)
                    || file.getTrangThaiXoa()
                    != TrangThaiXoaTep.CON_HIEU_LUC) {
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