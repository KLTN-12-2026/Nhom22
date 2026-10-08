package com.do_an_tot_nghiep.k28.content.service;

import com.do_an_tot_nghiep.k28.account.service.AccountService;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import com.do_an_tot_nghiep.k28.content.dto.LibraryCardQuery;
import com.do_an_tot_nghiep.k28.content.dto.LibraryCardResponse;
import com.do_an_tot_nghiep.k28.content.dto.LibraryDeckDetailResponse;
import com.do_an_tot_nghiep.k28.content.dto.LibraryDeckQuery;
import com.do_an_tot_nghiep.k28.content.dto.LibraryDeckResponse;
import com.do_an_tot_nghiep.k28.content.entity.BoThe;
import com.do_an_tot_nghiep.k28.content.entity.ChuDe;
import com.do_an_tot_nghiep.k28.content.entity.TheTuVung;
import com.do_an_tot_nghiep.k28.content.entity.enums.VaiTroTep;
import com.do_an_tot_nghiep.k28.content.mapper.LibraryCardMapper;
import com.do_an_tot_nghiep.k28.content.mapper.LibraryDeckMapper;
import com.do_an_tot_nghiep.k28.content.repository.BoTheRepository;
import com.do_an_tot_nghiep.k28.content.repository.CardLinkRepository;
import com.do_an_tot_nghiep.k28.content.repository.ChuDeRepository;
import com.do_an_tot_nghiep.k28.content.repository.LibraryDeckSpecifications;
import com.do_an_tot_nghiep.k28.content.repository.TheTuVungRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LibraryService {

    private final BoTheRepository decks;
    private final TheTuVungRepository cards;
    private final ChuDeRepository topics;
    private final AccountService accounts;
    private final LibraryDeckMapper mapper;
    private final CardLinkRepository links;
    private final LibraryCardMapper cardMapper;

    public PageResponse<LibraryDeckResponse> list(
            LibraryDeckQuery request
    ) {
        Specification<BoThe> specification =
                LibraryDeckSpecifications.matching(
                        request.q(),
                        request.topicId(),
                        request.trinhDo(),
                        request.mucTieu(),
                        request.nguon()
                ).and(
                        LibraryDeckSpecifications.ordered(request.sort())
                );

        Page<BoThe> result = decks.findAll(
                specification,
                PageRequest.of(request.page(), request.size())
        );

        return responses(result);
    }

    public LibraryDeckDetailResponse get(Long id, LibraryCardQuery request) {
        if (id == null || id <= 0) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    "id",
                    "ID bộ thẻ phải là số nguyên dương"
            );
        }

        BoThe deck = decks.findOne(
                LibraryDeckSpecifications.visibleById(id)
        ).orElseThrow(() -> new ApiException(
                ErrorCode.NOT_FOUND,
                "Không tìm thấy bộ thẻ"
        ));

        Page<TheTuVung> cardPage =
                cards.findByBoTheIdAndXoaAtIsNullOrderByIdDesc(
                        deck.getId(),
                        PageRequest.of(request.page(), request.size())
                );

        return new LibraryDeckDetailResponse(
                detailMetadata(deck, cardPage.getTotalElements()),
                cardResponses(cardPage)
        );
    }

    private LibraryDeckResponse detailMetadata(BoThe deck, long cardCount) {
        String topicName = deck.getChuDeId() == null
                ? null
                : topics.findById(deck.getChuDeId())
                        .map(ChuDe::getTen)
                        .orElse(null);

        String authorName = accounts.publicDisplayNames(
                List.of(deck.getChuSoHuuId())
        ).get(deck.getChuSoHuuId());

        return mapper.toResponse(deck, topicName, authorName, cardCount);
    }

    private PageResponse<LibraryCardResponse> cardResponses(
            Page<TheTuVung> result
    ) {
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

        return PageResponse.of(result.map(card -> {
            List<CardLinkRepository.FileLink> fileLinks =
                    filesByCard.getOrDefault(card.getId(), List.of());

            return cardMapper.toResponse(
                    card,
                    tagsByCard.getOrDefault(card.getId(), List.of()),
                    fileId(fileLinks, VaiTroTep.ANH),
                    fileId(fileLinks, VaiTroTep.AM_TU),
                    fileId(fileLinks, VaiTroTep.AM_CAU)
            );
        }));
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

    private PageResponse<LibraryDeckResponse> responses(
            Page<BoThe> result
    ) {
        List<Long> deckIds = result.getContent().stream()
                .map(BoThe::getId)
                .toList();

        Map<Long, Long> cardCounts = deckIds.isEmpty()
                ? Map.of()
                : cards.countActiveByDeckId(deckIds).stream()
                .collect(Collectors.toMap(
                        TheTuVungRepository.DeckCardCount::getBoTheId,
                        TheTuVungRepository.DeckCardCount::getSoThe
                ));

        Set<Long> topicIds = result.getContent().stream()
                .map(BoThe::getChuDeId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<Long, String> topicNames = topicIds.isEmpty()
                ? Map.of()
                : topics.findAllById(topicIds).stream()
                .collect(Collectors.toMap(
                        ChuDe::getId,
                        ChuDe::getTen
                ));

        List<Long> ownerIds = result.getContent().stream()
                .map(BoThe::getChuSoHuuId)
                .distinct()
                .toList();

        Map<Long, String> authorNames =
                accounts.publicDisplayNames(ownerIds);

        return PageResponse.of(result.map(deck ->
                mapper.toResponse(
                        deck,
                        deck.getChuDeId() == null
                                ? null
                                : topicNames.get(deck.getChuDeId()),
                        authorNames.get(deck.getChuSoHuuId()),
                        cardCounts.getOrDefault(deck.getId(), 0L)
                )
        ));
    }
}
