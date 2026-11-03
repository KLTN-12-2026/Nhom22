package com.do_an_tot_nghiep.k28.content.service;

import com.do_an_tot_nghiep.k28.account.service.AccountAdminService;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import com.do_an_tot_nghiep.k28.content.dto.CreateDeckRequest;
import com.do_an_tot_nghiep.k28.content.dto.SampleDeckResponse;
import com.do_an_tot_nghiep.k28.content.dto.UpdateDeckRequest;
import com.do_an_tot_nghiep.k28.content.entity.BoThe;
import com.do_an_tot_nghiep.k28.content.entity.ChuDe;
import com.do_an_tot_nghiep.k28.content.entity.enums.QuyenTruyCap;
import com.do_an_tot_nghiep.k28.content.entity.enums.TrangThaiBoMau;
import com.do_an_tot_nghiep.k28.content.entity.enums.TrangThaiKiemDuyet;
import com.do_an_tot_nghiep.k28.content.mapper.SampleDeckMapper;
import com.do_an_tot_nghiep.k28.content.repository.BoTheRepository;
import com.do_an_tot_nghiep.k28.content.repository.ChuDeRepository;
import com.do_an_tot_nghiep.k28.content.repository.TheTuVungRepository;
import jakarta.persistence.criteria.Predicate;
import java.time.Clock;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SampleDeckService {

    private final BoTheRepository decks;
    private final ChuDeRepository topics;
    private final TheTuVungRepository cards;
    private final AccountAdminService accounts;
    private final SampleDeckMapper mapper;
    private final Clock clock;

    public PageResponse<SampleDeckResponse> page(String q, TrangThaiBoMau trangThai, int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "page phải không âm, size từ 1 đến 100");
        }
        Page<BoThe> result = decks.findAll(
                matching(accounts.systemUserId(), q, trangThai),
                PageRequest.of(page, size, Sort.by(Sort.Order.desc("updatedAt"), Sort.Order.desc("id")))
        );
        List<BoThe> content = result.getContent();
        List<Long> ids = content.stream().map(BoThe::getId).toList();
        Map<Long, Long> cardCounts = cardCounts(ids);
        Map<Long, Long> copyCounts = counts(ids.isEmpty() ? List.of() : decks.countCopies(ids));
        Map<Long, String> topicNames = topicNames(content.stream().map(BoThe::getChuDeId).filter(Objects::nonNull).toList());
        return PageResponse.of(result.map(deck -> mapper.toResponse(
                deck,
                deck.getChuDeId() == null ? null : topicNames.get(deck.getChuDeId()),
                Math.toIntExact(cardCounts.getOrDefault(deck.getId(), 0L)),
                Math.toIntExact(copyCounts.getOrDefault(deck.getId(), 0L))
        )));
    }

    public SampleDeckResponse get(Long id) {
        return view(decks.findByIdAndChuSoHuuIdAndBoMauTrueAndXoaAtIsNull(id, accounts.systemUserId())
                .orElseThrow(SampleDeckService::notFound));
    }

    public Long ownerId() {
        return accounts.systemUserId();
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public SampleDeckResponse lock(Long id) {
        return view(locked(id));
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public SampleDeckResponse create(CreateDeckRequest request) {
        BoThe deck = BoThe.createSample(
                accounts.systemUserId(),
                validatedTopicId(request.chuDeId()),
                request.ten(),
                nullableDescription(request.moTa()),
                request.trinhDo(),
                request.mucTieu()
        );
        return view(decks.saveAndFlush(deck));
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public SampleDeckResponse update(Long id, UpdateDeckRequest request, TrangThaiKiemDuyet trangThaiKiemDuyet) {
        BoThe deck = locked(id);
        checkVersion(deck, request.version());
        boolean wasPublished = deck.isPublished();

        Long topicId = deck.getChuDeId();
        if (request.boChuDe()) {
            topicId = null;
        } else if (request.chuDeId() != null) {
            topicId = validatedTopicId(request.chuDeId());
        }
        deck.updateDetails(
                topicId,
                request.ten() == null ? deck.getTen() : request.ten(),
                request.moTa() == null ? deck.getMoTa() : nullableDescription(request.moTa()),
                request.trinhDo() == null ? deck.getTrinhDo() : request.trinhDo(),
                request.quyenTruyCap() == null ? deck.getQuyenTruyCap() : request.quyenTruyCap()
        );
        if (request.mucTieu() != null) {
            deck.updateGoal(request.mucTieu());
        }
        if (trangThaiKiemDuyet != null) {
            deck.moderate(trangThaiKiemDuyet);
        }
        if (deck.isPublished() && !wasPublished && activeCards(deck.getId()) == 0) {
            throw new ApiException(ErrorCode.BUSINESS_RULE, "Bộ chưa có thẻ nào. Thêm thẻ trước khi xuất bản");
        }
        decks.flush();
        return view(deck);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public SampleDeckResponse delete(Long id, Long version) {
        BoThe deck = locked(id);
        checkVersion(deck, version);
        SampleDeckResponse before = view(deck);
        deck.markDeleted(clock.instant());
        decks.flush();
        return before;
    }

    private BoThe locked(Long id) {
        return decks.findSampleForUpdate(id, accounts.systemUserId()).orElseThrow(SampleDeckService::notFound);
    }

    private SampleDeckResponse view(BoThe deck) {
        List<Long> ids = List.of(deck.getId());
        return mapper.toResponse(
                deck,
                deck.getChuDeId() == null ? null : topicNames(List.of(deck.getChuDeId())).get(deck.getChuDeId()),
                Math.toIntExact(cardCounts(ids).getOrDefault(deck.getId(), 0L)),
                Math.toIntExact(counts(decks.countCopies(ids)).getOrDefault(deck.getId(), 0L))
        );
    }

    private long activeCards(Long deckId) {
        return cardCounts(List.of(deckId)).getOrDefault(deckId, 0L);
    }

    private Map<Long, Long> cardCounts(List<Long> deckIds) {
        if (deckIds.isEmpty()) {
            return Map.of();
        }
        return cards.countActiveByDeckId(deckIds).stream()
                .collect(Collectors.toMap(
                        TheTuVungRepository.DeckCardCount::getBoTheId,
                        TheTuVungRepository.DeckCardCount::getSoThe
                ));
    }

    private static Map<Long, Long> counts(List<BoTheRepository.DeckCount> rows) {
        return rows.stream().collect(Collectors.toMap(
                BoTheRepository.DeckCount::getId,
                BoTheRepository.DeckCount::getSoLuong
        ));
    }

    private Map<Long, String> topicNames(Collection<Long> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        return topics.findAllById(ids).stream().collect(Collectors.toMap(ChuDe::getId, ChuDe::getTen));
    }

    private static Specification<BoThe> matching(Long ownerId, String q, TrangThaiBoMau trangThai) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("chuSoHuuId"), ownerId));
            predicates.add(cb.isTrue(root.get("boMau")));
            predicates.add(cb.isNull(root.get("xoaAt")));
            if (q != null && !q.isBlank()) {
                String pattern = "%" + q.strip().replace("!", "!!").replace("%", "!%").replace("_", "!_") + "%";
                predicates.add(cb.like(cb.lower(root.get("ten")), cb.lower(cb.literal(pattern)), '!'));
            }
            if (trangThai == TrangThaiBoMau.DA_AN) {
                predicates.add(cb.equal(root.get("trangThaiKiemDuyet"), TrangThaiKiemDuyet.DA_AN));
            } else if (trangThai != null) {
                predicates.add(cb.equal(root.get("trangThaiKiemDuyet"), TrangThaiKiemDuyet.BINH_THUONG));
                predicates.add(cb.equal(root.get("quyenTruyCap"), trangThai == TrangThaiBoMau.DA_XUAT_BAN
                        ? QuyenTruyCap.CONG_KHAI
                        : QuyenTruyCap.RIENG_TU));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    private Long validatedTopicId(String value) {
        if (value == null) {
            return null;
        }
        Long id = Long.valueOf(value);
        if (!topics.existsById(id)) {
            throw new ApiException(ErrorCode.BUSINESS_RULE, "chuDeId", "Chủ đề không còn tồn tại, vui lòng chọn lại");
        }
        return id;
    }

    private static void checkVersion(BoThe deck, Long version) {
        if (version == null || !Objects.equals(deck.getVersion(), version)) {
            throw new ApiException(ErrorCode.VERSION_CONFLICT, "Bộ mẫu đã thay đổi, vui lòng tải lại");
        }
    }

    private static String nullableDescription(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private static ApiException notFound() {
        return new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy bộ mẫu");
    }
}
