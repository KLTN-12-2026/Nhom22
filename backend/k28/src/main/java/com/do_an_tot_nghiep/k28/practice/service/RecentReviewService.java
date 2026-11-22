package com.do_an_tot_nghiep.k28.practice.service;

import com.do_an_tot_nghiep.k28.content.dto.StudyCardResponse;
import com.do_an_tot_nghiep.k28.content.service.CardService;
import com.do_an_tot_nghiep.k28.learning.entity.enums.DanhGia;
import com.do_an_tot_nghiep.k28.learning.entity.enums.TrangThaiTienDo;
import com.do_an_tot_nghiep.k28.practice.dto.RecentCardResponse;
import com.do_an_tot_nghiep.k28.practice.dto.RecentCardsResponse;
import com.do_an_tot_nghiep.k28.practice.repository.BaiLuyenRepository;
import com.do_an_tot_nghiep.k28.practice.repository.RecentRatingRow;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RecentReviewService {

    static final int SO_NGAY = 7;
    static final int SO_THE_XEM_TRUOC = 50;

    private final BaiLuyenRepository practices;
    private final CardService cardService;
    private final Clock clock;

    record Recent(StudyCardResponse card, DanhGia danhGia, Instant chamAt) {
    }

    @Transactional(readOnly = true)
    public RecentCardsResponse summary(Long userId, Set<DanhGia> ratings) {
        Instant since = since();
        List<Recent> all = recent(userId, since);
        Map<DanhGia, Integer> theoDanhGia = new EnumMap<>(DanhGia.class);
        for (DanhGia danhGia : DanhGia.values()) {
            theoDanhGia.put(danhGia, 0);
        }
        all.forEach(item -> theoDanhGia.merge(item.danhGia(), 1, Integer::sum));
        List<Recent> matched = filter(all, ratings);
        return new RecentCardsResponse(
                SO_NGAY,
                since,
                ratings.stream().sorted().toList(),
                theoDanhGia,
                matched.size(),
                matched.stream()
                        .limit(SO_THE_XEM_TRUOC)
                        .map(item -> new RecentCardResponse(
                                item.card().id(),
                                item.card().boTheId(),
                                item.card().tu(),
                                item.card().tuLoai(),
                                item.card().nghiaVi(),
                                item.danhGia(),
                                item.chamAt()))
                        .toList());
    }

    List<Long> cardIds(Long userId, Set<DanhGia> ratings) {
        return filter(recent(userId, since()), ratings).stream()
                .map(item -> Long.valueOf(item.card().id()))
                .toList();
    }

    private Instant since() {
        return clock.instant().minus(Duration.ofDays(SO_NGAY));
    }

    private List<Recent> filter(List<Recent> all, Set<DanhGia> ratings) {
        return all.stream()
                .filter(item -> ratings.contains(item.danhGia()))
                .sorted(Comparator.comparing(Recent::danhGia).thenComparing(Recent::chamAt, Comparator.reverseOrder()))
                .toList();
    }

    private List<Recent> recent(Long userId, Instant since) {
        Map<Long, RecentRatingRow> latest = new LinkedHashMap<>();
        practices.recentRatings(userId, since).forEach(row -> latest.putIfAbsent(row.theId(), row));
        if (latest.isEmpty()) {
            return List.of();
        }
        Set<Long> usable = new HashSet<>(practices.usableCardIds(userId, TrangThaiTienDo.TAM_NGUNG));
        List<Long> ids = latest.keySet().stream().filter(usable::contains).toList();
        if (ids.isEmpty()) {
            return List.of();
        }
        Map<Long, StudyCardResponse> cards = cardService.studyCards(userId, ids);
        return ids.stream()
                .filter(cards::containsKey)
                .map(id -> new Recent(cards.get(id), latest.get(id).danhGia(), latest.get(id).createdAt()))
                .toList();
    }
}
