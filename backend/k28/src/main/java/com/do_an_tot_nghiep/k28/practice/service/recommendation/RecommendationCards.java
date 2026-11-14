package com.do_an_tot_nghiep.k28.practice.service.recommendation;

import com.do_an_tot_nghiep.k28.learning.entity.enums.TrangThaiTienDo;
import com.do_an_tot_nghiep.k28.practice.repository.NotebookCardRow;
import com.do_an_tot_nghiep.k28.practice.repository.SoTayTuKhoRepository;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RecommendationCards {

    private final SoTayTuKhoRepository notebook;

    public Map<Long, NotebookCardRow> usable(Long userId, Collection<Long> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        Set<Long> suspended = new HashSet<>(notebook.suspendedCardIds(userId, ids, TrangThaiTienDo.TAM_NGUNG));
        Map<Long, NotebookCardRow> cards = new HashMap<>();
        notebook.cards(userId, ids).stream()
                .filter(card -> !suspended.contains(card.theId()))
                .forEach(card -> cards.put(card.theId(), card));
        return cards;
    }
}
