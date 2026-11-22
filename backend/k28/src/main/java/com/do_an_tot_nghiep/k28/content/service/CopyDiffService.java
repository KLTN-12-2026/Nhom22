package com.do_an_tot_nghiep.k28.content.service;

import com.do_an_tot_nghiep.k28.content.dto.CopyDiffResponse;
import com.do_an_tot_nghiep.k28.content.dto.CopyDiffResponse.CardChange;
import com.do_an_tot_nghiep.k28.content.dto.CopyDiffResponse.FieldChange;
import com.do_an_tot_nghiep.k28.content.entity.BoThe;
import com.do_an_tot_nghiep.k28.content.entity.ChuDe;
import com.do_an_tot_nghiep.k28.content.entity.TheTuVung;
import com.do_an_tot_nghiep.k28.content.repository.ChuDeRepository;
import com.do_an_tot_nghiep.k28.content.repository.TheTuVungRepository;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CopyDiffService {

    private static final List<Map.Entry<String, Function<TheTuVung, Object>>> CARD_FIELDS = List.of(
            Map.entry("tu", TheTuVung::getTu),
            Map.entry("tuLoai", TheTuVung::getTuLoai),
            Map.entry("phienAm", TheTuVung::getPhienAm),
            Map.entry("nghiaVi", TheTuVung::getNghiaVi),
            Map.entry("viDuEn", TheTuVung::getViDuEn),
            Map.entry("dichVi", TheTuVung::getDichVi),
            Map.entry("doKho", TheTuVung::getDoKho),
            Map.entry("nguon", TheTuVung::getNguon)
    );

    private final TheTuVungRepository cards;
    private final ChuDeRepository topics;

    @Transactional(readOnly = true)
    public CopyDiffResponse diff(BoThe copy, BoThe source) {
        List<FieldChange> deckChanges = deckChanges(copy, source);
        List<TheTuVung> sourceCards = cards.findAllForCopy(source.getId());
        List<TheTuVung> copyCards = cards.findAllForCopy(copy.getId());

        Map<String, Deque<TheTuVung>> byWord = new LinkedHashMap<>();
        copyCards.forEach(card -> byWord.computeIfAbsent(key(card.getTu()), ignored -> new ArrayDeque<>()).add(card));

        List<CardChange> changed = new ArrayList<>();
        List<TheTuVung> removed = new ArrayList<>();
        for (TheTuVung original : sourceCards) {
            Deque<TheTuVung> candidates = byWord.get(key(original.getTu()));
            TheTuVung match = candidates == null ? null : candidates.pollFirst();
            if (match == null) {
                removed.add(original);
                continue;
            }
            List<FieldChange> fields = cardChanges(match, original);
            if (!fields.isEmpty()) {
                changed.add(new CardChange("SUA", match.getId().toString(), match.getTu(), original.getTu(), fields));
            }
        }
        List<TheTuVung> added = new ArrayList<>();
        byWord.values().forEach(added::addAll);

        Iterator<TheTuVung> removedIterator = removed.iterator();
        while (removedIterator.hasNext()) {
            TheTuVung original = removedIterator.next();
            TheTuVung renamed = added.stream()
                    .filter(card -> key(card.getNghiaVi()).equals(key(original.getNghiaVi())))
                    .findFirst()
                    .orElse(null);
            if (renamed != null) {
                added.remove(renamed);
                removedIterator.remove();
                changed.add(new CardChange("SUA", renamed.getId().toString(), renamed.getTu(), original.getTu(),
                        cardChanges(renamed, original)));
            }
        }

        List<CardChange> cardChanges = new ArrayList<>();
        added.forEach(card -> cardChanges.add(new CardChange("THEM", card.getId().toString(), card.getTu(), null,
                List.of())));
        changed.forEach(cardChanges::add);
        removed.forEach(card -> cardChanges.add(new CardChange("XOA", card.getId().toString(), card.getTu(),
                card.getTu(), List.of())));

        boolean any = !deckChanges.isEmpty() || !cardChanges.isEmpty();
        return new CopyDiffResponse(any, sourceCards.size(), copyCards.size(), added.size(), removed.size(),
                changed.size(), deckChanges, cardChanges);
    }

    private List<FieldChange> deckChanges(BoThe copy, BoThe source) {
        List<FieldChange> changes = new ArrayList<>();
        add(changes, "ten", source.getTen(), copy.getTen());
        add(changes, "moTa", source.getMoTa(), copy.getMoTa());
        if (!Objects.equals(source.getChuDeId(), copy.getChuDeId())) {
            changes.add(new FieldChange("chuDe", topicName(source.getChuDeId()), topicName(copy.getChuDeId())));
        }
        add(changes, "trinhDo", name(source.getTrinhDo()), name(copy.getTrinhDo()));
        add(changes, "mucTieu", name(source.getMucTieu()), name(copy.getMucTieu()));
        return changes;
    }

    private List<FieldChange> cardChanges(TheTuVung copy, TheTuVung source) {
        List<FieldChange> changes = new ArrayList<>();
        CARD_FIELDS.forEach(field -> add(changes, field.getKey(),
                text(field.getValue().apply(source)), text(field.getValue().apply(copy))));
        return changes;
    }

    private void add(List<FieldChange> changes, String field, String before, String after) {
        if (!Objects.equals(clean(before), clean(after))) {
            changes.add(new FieldChange(field, clean(before), clean(after)));
        }
    }

    private String topicName(Long id) {
        return id == null ? null : topics.findById(id).map(ChuDe::getTen).orElse(null);
    }

    private static String name(Enum<?> value) {
        return value == null ? null : value.name();
    }

    private static String text(Object value) {
        return value == null ? null : value.toString();
    }

    private static String clean(String value) {
        if (value == null) {
            return null;
        }
        String stripped = value.strip();
        return stripped.isEmpty() ? null : stripped;
    }

    private static String key(String value) {
        String cleaned = clean(value);
        return cleaned == null ? "" : cleaned.replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
    }
}
