package com.do_an_tot_nghiep.k28.content.service;

import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import com.do_an_tot_nghiep.k28.content.dto.CreateDeckRequest;
import com.do_an_tot_nghiep.k28.content.dto.DeckResponse;
import com.do_an_tot_nghiep.k28.content.dto.UpdateDeckRequest;
import com.do_an_tot_nghiep.k28.content.entity.BoThe;
import com.do_an_tot_nghiep.k28.content.entity.enums.QuyenTruyCap;
import com.do_an_tot_nghiep.k28.content.entity.enums.TrangThaiKiemDuyet;
import com.do_an_tot_nghiep.k28.content.mapper.DeckMapper;
import com.do_an_tot_nghiep.k28.content.repository.BoTheRepository;
import com.do_an_tot_nghiep.k28.content.repository.ChuDeRepository;
import com.do_an_tot_nghiep.k28.content.repository.DeckFavoriteRepository;
import java.time.Clock;
import java.util.Objects;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DeckService {

    private final BoTheRepository decks;
    private final ChuDeRepository topics;
    private final DeckFavoriteRepository favorites;
    private final DeckMapper mapper;
    private final Clock clock;

    public PageResponse<DeckResponse> list(Long userId, int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    "page phải không âm, size từ 1 đến 100"
            );
        }

        Page<BoThe> result =
                decks.findByChuSoHuuIdAndXoaAtIsNullOrderByCreatedAtDescIdDesc(
                        userId, PageRequest.of(page, size)
                );
        Set<Long> favoriteIds = favorites.findFavoriteDeckIds(
                userId,
                result.getContent().stream().map(BoThe::getId).toList()
        );

        return PageResponse.of(result.map(deck ->
                mapper.toResponse(deck, favoriteIds.contains(deck.getId()))
        ));
    }

    public DeckResponse get(Long userId, Long id) {
        return response(userId, ownedDeck(userId, id));
    }

    @Transactional
    public DeckResponse create(Long userId, CreateDeckRequest request) {
        BoThe deck = BoThe.create(
                userId,
                validatedTopicId(request.chuDeId()),
                request.ten(),
                nullableDescription(request.moTa()),
                request.trinhDo(),
                request.quyenTruyCap()
        );
        return mapper.toResponse(decks.saveAndFlush(deck), false);
    }

    @Transactional
    public DeckResponse update(
            Long userId,
            Long id,
            UpdateDeckRequest request
    ) {
        BoThe deck = ownedDeck(userId, id);
        checkVersion(deck, request.version());

        Long topicId = deck.getChuDeId();
        if (request.boChuDe()) {
            topicId = null;
        } else if (request.chuDeId() != null) {
            topicId = validatedTopicId(request.chuDeId());
        }

        deck.updateDetails(
                topicId,
                request.ten() == null ? deck.getTen() : request.ten(),
                request.moTa() == null
                        ? deck.getMoTa()
                        : nullableDescription(request.moTa()),
                request.trinhDo() == null
                        ? deck.getTrinhDo()
                        : request.trinhDo(),
                request.quyenTruyCap() == null
                        ? deck.getQuyenTruyCap()
                        : request.quyenTruyCap()
        );
        decks.flush();
        return response(userId, deck);
    }

    @Transactional
    public void delete(Long userId, Long id, Long version) {
        BoThe deck = ownedDeck(userId, id);
        checkVersion(deck, version);
        deck.markDeleted(clock.instant());
        decks.flush();
    }

    @Transactional
    public void favorite(Long userId, Long id) {
        BoThe deck = decks.findByIdAndXoaAtIsNull(id)
                .orElseThrow(this::notFound);

        boolean owner = Objects.equals(deck.getChuSoHuuId(), userId);
        boolean publiclyVisible =
                deck.getQuyenTruyCap() == QuyenTruyCap.CONG_KHAI
                        && deck.getTrangThaiKiemDuyet()
                        == TrangThaiKiemDuyet.BINH_THUONG;

        if (!owner && !publiclyVisible) {
            throw notFound();
        }
        favorites.add(userId, id, clock.instant());
    }

    @Transactional
    public void unfavorite(Long userId, Long id) {
        favorites.remove(userId, id);
    }

    private BoThe ownedDeck(Long userId, Long id) {
        return decks.findByIdAndChuSoHuuIdAndXoaAtIsNull(id, userId)
                .orElseThrow(this::notFound);
    }

    private DeckResponse response(Long userId, BoThe deck) {
        return mapper.toResponse(
                deck, favorites.exists(userId, deck.getId())
        );
    }

    private Long validatedTopicId(String value) {
        if (value == null) {
            return null;
        }
        Long id = Long.valueOf(value);
        if (!topics.existsById(id)) {
            throw new ApiException(
                    ErrorCode.BUSINESS_RULE,
                    "chuDeId",
                    "Chủ đề không còn tồn tại, vui lòng chọn lại"
            );
        }
        return id;
    }

    private void checkVersion(BoThe deck, Long version) {
        if (version == null || !Objects.equals(deck.getVersion(), version)) {
            throw new ApiException(
                    ErrorCode.VERSION_CONFLICT,
                    "Bộ thẻ đã thay đổi, vui lòng tải lại"
            );
        }
    }

    private String nullableDescription(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private ApiException notFound() {
        return new ApiException(
                ErrorCode.NOT_FOUND, "Không tìm thấy bộ thẻ"
        );
    }
}