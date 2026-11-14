package com.do_an_tot_nghiep.k28.content.service;

import com.do_an_tot_nghiep.k28.account.entity.enums.TrinhDo;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.content.dto.CreateDeckRequest;
import com.do_an_tot_nghiep.k28.content.entity.TheTuVung;
import com.do_an_tot_nghiep.k28.content.entity.enums.QuyenTruyCap;
import com.do_an_tot_nghiep.k28.content.repository.BoTheRepository;
import com.do_an_tot_nghiep.k28.content.repository.TheTuVungRepository;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CardDraftTargetService {

    private final BoTheRepository decks;
    private final TheTuVungRepository cards;
    private final DeckService deckService;

    public static String termKey(String tu) {
        return CardText.duplicateKey(tu, null).tu();
    }

    public void requireOwnedDeck(Long userId, Long deckId) {
        decks.findByIdAndChuSoHuuIdAndXoaAtIsNull(deckId, userId).orElseThrow(this::deckNotFound);
    }

    public Map<String, List<Long>> termIndex(Long userId, Long deckId) {
        Map<String, List<Long>> index = new LinkedHashMap<>();
        if (decks.findByIdAndChuSoHuuIdAndXoaAtIsNull(deckId, userId).isEmpty()) {
            return index;
        }
        for (var candidate : cards.findDuplicateCandidates(deckId)) {
            index.computeIfAbsent(termKey(candidate.getTu()), key -> new ArrayList<>()).add(candidate.getId());
        }
        return index;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public Long lockOwnedDeck(Long userId, Long deckId) {
        return decks.findOwnedForUpdate(deckId, userId).orElseThrow(this::deckNotFound).getId();
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public Long createPrivateDeck(Long userId, String ten) {
        var deck = deckService.create(userId,
                new CreateDeckRequest(ten, null, null, TrinhDo.CO_BAN, QuyenTruyCap.RIENG_TU, null));
        return Long.valueOf(deck.id());
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public Long createCard(Long deckId, String tu, String tuLoai, String nghiaVi, String viDuEn, String dichVi) {
        return cards.saveAndFlush(TheTuVung.builder().boTheId(deckId)
                .tu(CardText.term(tu)).tuLoai(CardText.nullable(CardText.text(tuLoai)))
                .nghiaVi(CardText.text(nghiaVi)).viDuEn(CardText.nullable(CardText.text(viDuEn)))
                .dichVi(CardText.nullable(CardText.text(dichVi))).doKho(1).build()).getId();
    }

    private ApiException deckNotFound() {
        return new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy bộ thẻ");
    }
}
