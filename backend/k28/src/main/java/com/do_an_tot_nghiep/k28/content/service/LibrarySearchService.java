package com.do_an_tot_nghiep.k28.content.service;

import com.do_an_tot_nghiep.k28.common.quota.GoiDichVuResolver;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import com.do_an_tot_nghiep.k28.content.dto.AuthorProfileResponse;
import com.do_an_tot_nghiep.k28.content.dto.FileResponse;
import com.do_an_tot_nghiep.k28.content.dto.LibraryAuthorResponse;
import com.do_an_tot_nghiep.k28.content.dto.PublicBadgeResponse;
import com.do_an_tot_nghiep.k28.engagement.dto.BadgeResponse;
import com.do_an_tot_nghiep.k28.engagement.service.EngagementService;
import com.do_an_tot_nghiep.k28.content.dto.LibraryDeckResponse;
import com.do_an_tot_nghiep.k28.content.dto.LibrarySearchCardResponse;
import com.do_an_tot_nghiep.k28.content.dto.LibrarySearchQuery;
import com.do_an_tot_nghiep.k28.content.dto.LibrarySuggestQuery;
import com.do_an_tot_nghiep.k28.content.dto.LibrarySuggestResponse;
import com.do_an_tot_nghiep.k28.content.entity.BoThe;
import com.do_an_tot_nghiep.k28.content.repository.BoTheRepository;
import com.do_an_tot_nghiep.k28.content.repository.LibraryDeckSpecifications;
import com.do_an_tot_nghiep.k28.content.repository.LibrarySearchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LibrarySearchService {

    private static final Sort DECK_ORDER = Sort.by(
            Sort.Order.desc("updatedAt"),
            Sort.Order.desc("id")
    );

    private final LibrarySearchRepository search;
    private final BoTheRepository decks;
    private final LibraryService library;
    private final FileService fileService;
    private final EngagementService engagementService;
    private final GoiDichVuResolver plans;

    public LibrarySuggestResponse suggest(LibrarySuggestQuery request, Long viewerId) {
        String escaped = escaped(request.q());
        int limit = request.limit();

        LibrarySuggestResponse.Mine mine = viewerId == null
                ? null
                : new LibrarySuggestResponse.Mine(
                        ownDecks(viewerId, request.q(), limit),
                        page(
                                search.ownCards(viewerId, escaped, 0, limit),
                                0, limit,
                                search.countOwnCards(viewerId, escaped)
                        )
                );

        return new LibrarySuggestResponse(
                request.q(),
                page(
                        search.publicCards(escaped, 0, limit),
                        0, limit,
                        search.countPublicCards(escaped)
                ),
                publicDecks(request.q(), limit),
                page(
                        search.authors(escaped, 0, limit),
                        0, limit,
                        search.countAuthors(escaped)
                ),
                search.topics(escaped, limit),
                mine
        );
    }

    public PageResponse<LibrarySearchCardResponse> cards(LibrarySearchQuery request) {
        String escaped = escaped(request.q());
        return page(
                search.publicCards(escaped, request.page() * request.size(), request.size()),
                request.page(), request.size(),
                search.countPublicCards(escaped)
        );
    }

    public PageResponse<LibraryAuthorResponse> authors(LibrarySearchQuery request) {
        String escaped = escaped(request.q());
        return page(
                search.authors(escaped, request.page() * request.size(), request.size()),
                request.page(), request.size(),
                search.countAuthors(escaped)
        );
    }

    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public AuthorProfileResponse author(Long id) {
        if (id == null || id <= 0) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    "id",
                    "ID tác giả phải là số nguyên dương"
            );
        }

        LibraryAuthorResponse author = search.author(id).orElseThrow(() -> new ApiException(
                ErrorCode.NOT_FOUND,
                "Không tìm thấy tác giả"
        ));
        FileResponse avatar = fileService.publicAvatar(id);
        List<PublicBadgeResponse> huyHieu = engagementService.badges(id).stream()
                .filter(BadgeResponse::daNhan)
                .map(badge -> new PublicBadgeResponse(badge.ma(), badge.ten(), badge.moTa(), badge.nhanAt()))
                .toList();
        return new AuthorProfileResponse(
                author.id(),
                author.tenHienThi(),
                author.soBoThe(),
                author.soThe(),
                search.joinedAt(id).orElse(null),
                avatar == null ? null : avatar.downloadUrl(),
                huyHieu,
                Optional.ofNullable(plans.goiMa(id)).orElse("FREE")
        );
    }

    private PageResponse<LibraryDeckResponse> publicDecks(String q, int limit) {
        Specification<BoThe> specification = LibraryDeckSpecifications.matching(
                q, null, null, null, null, null
        );
        return library.summaries(decks.findAll(
                specification,
                PageRequest.of(0, limit, DECK_ORDER)
        ));
    }

    private PageResponse<LibraryDeckResponse> ownDecks(Long ownerId, String q, int limit) {
        return library.summaries(decks.findAll(
                LibraryDeckSpecifications.ownedMatching(ownerId, q),
                PageRequest.of(0, limit, DECK_ORDER)
        ));
    }

    private static String escaped(String q) {
        String escaped = LibraryDeckSpecifications.escapeLike(q);
        if (escaped == null) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    "q",
                    "Từ khóa không được để trống"
            );
        }
        return escaped;
    }

    private static <T> PageResponse<T> page(List<T> items, int page, int size, long total) {
        return new PageResponse<>(
                items,
                page,
                size,
                total,
                size == 0 ? 0 : (int) Math.ceil((double) total / size)
        );
    }
}
