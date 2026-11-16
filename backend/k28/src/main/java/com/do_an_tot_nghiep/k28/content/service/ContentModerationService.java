package com.do_an_tot_nghiep.k28.content.service;

import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.content.entity.BoThe;
import com.do_an_tot_nghiep.k28.content.entity.TheTuVung;
import com.do_an_tot_nghiep.k28.content.entity.enums.TrangThaiKiemDuyet;
import com.do_an_tot_nghiep.k28.content.repository.BoTheRepository;
import com.do_an_tot_nghiep.k28.content.repository.TheTuVungRepository;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ContentModerationService {

    private final BoTheRepository decks;
    private final TheTuVungRepository cards;

    @Transactional(readOnly = true)
    public Map<String, Object> deckSnapshot(Long reporterId, Long deckId) {
        BoThe deck = reportableDeck(reporterId, deckId, "Không tìm thấy bộ thẻ");
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("ten", deck.getTen());
        snapshot.put("moTa", deck.getMoTa());
        snapshot.put("boMau", deck.isBoMau());
        snapshot.put("chuSoHuuId", String.valueOf(deck.getChuSoHuuId()));
        return snapshot;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> cardSnapshot(Long reporterId, Long cardId) {
        TheTuVung card = cards.findByIdAndXoaAtIsNull(cardId)
                .filter(found -> !found.isAnKiemDuyet())
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy thẻ"));
        BoThe deck = reportableDeck(reporterId, card.getBoTheId(), "Không tìm thấy thẻ");
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("ten", card.getTu() + " (" + deck.getTen() + ")");
        snapshot.put("tu", card.getTu());
        snapshot.put("tuLoai", card.getTuLoai());
        snapshot.put("nghiaVi", card.getNghiaVi());
        snapshot.put("phienAm", card.getPhienAm());
        snapshot.put("viDuEn", card.getViDuEn());
        snapshot.put("dichVi", card.getDichVi());
        snapshot.put("boTheId", String.valueOf(deck.getId()));
        snapshot.put("chuSoHuuId", String.valueOf(deck.getChuSoHuuId()));
        return snapshot;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public Boolean moderateDeck(Long deckId, boolean hide) {
        return decks.findById(deckId)
                .filter(deck -> deck.getXoaAt() == null)
                .map(deck -> {
                    boolean before = deck.getTrangThaiKiemDuyet() == TrangThaiKiemDuyet.DA_AN;
                    if (hide && !before) {
                        deck.moderate(TrangThaiKiemDuyet.DA_AN);
                        decks.flush();
                    }
                    return before;
                })
                .orElse(null);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public Boolean moderateCard(Long cardId, boolean hide) {
        return cards.findByIdAndXoaAtIsNull(cardId)
                .map(card -> {
                    boolean before = card.isAnKiemDuyet();
                    if (hide && !before) {
                        card.hideByModeration();
                        cards.flush();
                    }
                    return before;
                })
                .orElse(null);
    }

    private BoThe reportableDeck(Long reporterId, Long deckId, String notFound) {
        BoThe deck = decks.findById(deckId)
                .filter(found -> found.getXoaAt() == null)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, notFound));
        if (Objects.equals(deck.getChuSoHuuId(), reporterId)) {
            throw new ApiException(ErrorCode.BUSINESS_RULE, "Không thể báo cáo nội dung của chính bạn");
        }
        if (!deck.isPublished()) {
            throw new ApiException(ErrorCode.NOT_FOUND, notFound);
        }
        return deck;
    }
}
