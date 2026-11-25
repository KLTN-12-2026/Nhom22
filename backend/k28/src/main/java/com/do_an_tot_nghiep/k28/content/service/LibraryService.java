package com.do_an_tot_nghiep.k28.content.service;

import com.do_an_tot_nghiep.k28.account.service.AccountService;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import com.do_an_tot_nghiep.k28.content.dto.CardSort;
import com.do_an_tot_nghiep.k28.content.dto.LibraryCardQuery;
import com.do_an_tot_nghiep.k28.content.dto.LibraryCardResponse;
import com.do_an_tot_nghiep.k28.content.dto.LibraryDeckDetailResponse;
import com.do_an_tot_nghiep.k28.content.dto.LibraryDeckQuery;
import com.do_an_tot_nghiep.k28.content.dto.BanSaoResponse;
import com.do_an_tot_nghiep.k28.content.dto.LibraryDeckResponse;
import com.do_an_tot_nghiep.k28.content.dto.LibraryHighlightsResponse;
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
import com.do_an_tot_nghiep.k28.content.repository.LibraryHighlightRepository;
import com.do_an_tot_nghiep.k28.content.repository.TheTuVungRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LibraryService {

    private static final int HIGHLIGHT_DAYS = 7;
    private static final int HIGHLIGHT_LIMIT = 5;

    private final BoTheRepository decks;
    private final CopyInfoService copyInfo;
    private final TheTuVungRepository cards;
    private final ChuDeRepository topics;
    private final AccountService accounts;
    private final LibraryDeckMapper mapper;
    private final CardLinkRepository links;
    private final LibraryCardMapper cardMapper;
    private final LibraryHighlightRepository highlightQueries;
    private final Clock clock;

    public PageResponse<LibraryDeckResponse> list(
            LibraryDeckQuery request
    ) {
        Specification<BoThe> specification =
                LibraryDeckSpecifications.matching(
                        request.q(),
                        request.topicId(),
                        request.trinhDo(),
                        request.mucTieu(),
                        request.nguon(),
                        request.ownerId()
                ).and(
                        LibraryDeckSpecifications.ordered(
                                request.sort(),
                                clock.instant().minus(HIGHLIGHT_DAYS, ChronoUnit.DAYS)
                        )
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
        ).orElseThrow(() -> decks.findById(id)
                .filter(found -> accounts.isUnavailable(found.getChuSoHuuId()))
                .map(found -> UnavailableUser.error())
                .orElseGet(() -> new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy bộ thẻ")));

        boolean filtered = CardSort.filtered(request.q(), request.sapXep());
        Page<TheTuVung> cardPage;
        long totalCards;
        if (filtered) {
            cardPage = cards.searchPublic(
                    deck.getId(),
                    CardSort.likePattern(request.q()),
                    PageRequest.of(request.page(), request.size(), request.sapXep().sort())
            );
            totalCards = cards.countByBoTheIdAndXoaAtIsNullAndAnKiemDuyetFalse(deck.getId());
        } else {
            cardPage = cards.findByBoTheIdAndXoaAtIsNullAndAnKiemDuyetFalseOrderByIdDesc(
                    deck.getId(),
                    PageRequest.of(cardPage(deck.getId(), request), request.size())
            );
            totalCards = cardPage.getTotalElements();
        }

        return new LibraryDeckDetailResponse(
                detailMetadata(deck, totalCards),
                cardResponses(cardPage)
        );
    }

    private int cardPage(Long deckId, LibraryCardQuery request) {
        Long cardId = request.cardId();
        if (cardId == null
                || !cards.existsByIdAndBoTheIdAndXoaAtIsNullAndAnKiemDuyetFalse(cardId, deckId)) {
            return request.page();
        }

        long before = cards.countByBoTheIdAndXoaAtIsNullAndAnKiemDuyetFalseAndIdGreaterThan(
                deckId,
                cardId
        );
        return (int) (before / request.size());
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

        return mapper.toResponse(deck, topicName, authorName, cardCount,
                copyInfo.origins(List.of(deck)).get(deck.getId()));
    }

    PageResponse<LibraryCardResponse> cardResponses(
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

    public LibraryHighlightsResponse highlights() {
        Instant denLuc = clock.instant();
        Instant tuLuc = denLuc.minus(HIGHLIGHT_DAYS, ChronoUnit.DAYS);

        List<LibraryHighlightRepository.DeckCount> weekly =
                highlightQueries.topFavoritedDecks(tuLuc, HIGHLIGHT_LIMIT);
        List<LibraryHighlightRepository.DeckCount> allTime =
                highlightQueries.topFavoritedDecks(null, HIGHLIGHT_LIMIT);

        Set<Long> deckIds = new HashSet<>();
        weekly.forEach(count -> deckIds.add(count.boTheId()));
        allTime.forEach(count -> deckIds.add(count.boTheId()));
        List<BoThe> loaded = decks.findAllById(deckIds);
        Function<BoThe, LibraryDeckResponse> toResponse = responder(loaded);
        Map<Long, LibraryDeckResponse> byId = loaded.stream()
                .collect(Collectors.toMap(BoThe::getId, toResponse));

        List<LibraryHighlightRepository.Contribution> contributions =
                highlightQueries.topContributors(tuLuc, HIGHLIGHT_LIMIT);
        List<Long> ownerIds = contributions.stream()
                .map(LibraryHighlightRepository.Contribution::chuSoHuuId)
                .toList();
        Map<Long, String> names = accounts.publicDisplayNames(ownerIds);
        Map<Long, Long> deckCounts = highlightQueries.publicDeckCounts(ownerIds);

        return new LibraryHighlightsResponse(
                tuLuc,
                denLuc,
                highlightDecks(weekly, byId),
                highlightDecks(allTime, byId),
                contributions.stream()
                        .map(item -> new LibraryHighlightsResponse.Contributor(
                                item.chuSoHuuId().toString(),
                                names.get(item.chuSoHuuId()),
                                deckCounts.getOrDefault(item.chuSoHuuId(), 0L),
                                item.soYeuThich(),
                                item.soSaoChep()
                        ))
                        .toList()
        );
    }

    private static List<LibraryHighlightsResponse.HighlightDeck> highlightDecks(
            List<LibraryHighlightRepository.DeckCount> counts,
            Map<Long, LibraryDeckResponse> byId
    ) {
        return counts.stream()
                .filter(count -> byId.containsKey(count.boTheId()))
                .map(count -> new LibraryHighlightsResponse.HighlightDeck(
                        byId.get(count.boTheId()),
                        count.soYeuThich()
                ))
                .toList();
    }

    public PageResponse<LibraryDeckResponse> summaries(Page<BoThe> result) {
        return responses(result);
    }

    private PageResponse<LibraryDeckResponse> responses(
            Page<BoThe> result
    ) {
        return PageResponse.of(result.map(responder(result.getContent())));
    }

    private Function<BoThe, LibraryDeckResponse> responder(
            List<BoThe> content
    ) {
        List<Long> deckIds = content.stream()
                .map(BoThe::getId)
                .toList();

        Map<Long, Long> cardCounts = deckIds.isEmpty()
                ? Map.of()
                : cards.countVisibleByDeckId(deckIds).stream()
                .collect(Collectors.toMap(
                        TheTuVungRepository.DeckCardCount::getBoTheId,
                        TheTuVungRepository.DeckCardCount::getSoThe
                ));

        Set<Long> topicIds = content.stream()
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

        List<Long> ownerIds = content.stream()
                .map(BoThe::getChuSoHuuId)
                .distinct()
                .toList();

        Map<Long, String> authorNames =
                accounts.publicDisplayNames(ownerIds);
        Map<Long, BanSaoResponse> origins = copyInfo.origins(content);

        return deck -> mapper.toResponse(
                deck,
                deck.getChuDeId() == null
                        ? null
                        : topicNames.get(deck.getChuDeId()),
                authorNames.get(deck.getChuSoHuuId()),
                cardCounts.getOrDefault(deck.getId(), 0L),
                origins.get(deck.getId())
        );
    }
}
