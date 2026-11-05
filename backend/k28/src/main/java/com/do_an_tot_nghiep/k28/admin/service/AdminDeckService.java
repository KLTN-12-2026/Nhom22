package com.do_an_tot_nghiep.k28.admin.service;

import com.do_an_tot_nghiep.k28.admin.dto.CreateSampleDeckRequest;
import com.do_an_tot_nghiep.k28.admin.dto.DeleteSampleDeckRequest;
import com.do_an_tot_nghiep.k28.admin.dto.UpdateSampleDeckRequest;
import com.do_an_tot_nghiep.k28.admin.entity.enums.HanhDongQuanTri;
import com.do_an_tot_nghiep.k28.admin.entity.enums.LoaiDoiTuong;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import com.do_an_tot_nghiep.k28.content.dto.CardResponse;
import com.do_an_tot_nghiep.k28.content.dto.CreateCardRequest;
import com.do_an_tot_nghiep.k28.content.dto.SampleDeckResponse;
import com.do_an_tot_nghiep.k28.content.dto.UpdateCardRequest;
import com.do_an_tot_nghiep.k28.content.entity.enums.QuyenTruyCap;
import com.do_an_tot_nghiep.k28.content.entity.enums.TrangThaiBoMau;
import com.do_an_tot_nghiep.k28.content.entity.enums.TrangThaiKiemDuyet;
import com.do_an_tot_nghiep.k28.content.service.CardService;
import com.do_an_tot_nghiep.k28.content.service.SampleDeckService;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminDeckService {

    private static final Map<String, String> FILE_FIELDS = Map.of("anhId", "anh", "amTuId", "amTu", "amCauId", "amCau");

    private final SampleDeckService samples;
    private final CardService cards;
    private final AuditService audit;

    public PageResponse<SampleDeckResponse> list(String q, TrangThaiBoMau trangThai, int page, int size) {
        if (q != null && q.length() > 150) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "q", "Từ khóa tối đa 150 ký tự");
        }
        return samples.page(q, trangThai, page, size);
    }

    public SampleDeckResponse get(Long id) {
        return samples.get(id);
    }

    @Transactional
    public SampleDeckResponse create(Long actorId, CreateSampleDeckRequest request) {
        SampleDeckResponse deck = samples.create(request.toDeckRequest());
        audit.record(actorId, HanhDongQuanTri.TAO_BO_MAU, LoaiDoiTuong.BO_THE, Long.valueOf(deck.id()), deck.ten(),
                null, null, deckFields(deck));
        return deck;
    }

    @Transactional
    public SampleDeckResponse update(Long actorId, Long id, UpdateSampleDeckRequest request) {
        SampleDeckResponse before = samples.lock(id);
        SampleDeckResponse after = samples.update(id, request.toDeckRequest(), request.trangThaiKiemDuyet());
        Map<String, Object> truoc = deckFields(before);
        Map<String, Object> sau = deckFields(after);
        truoc.keySet().removeIf(key -> Objects.equals(truoc.get(key), sau.get(key)));
        sau.keySet().retainAll(truoc.keySet());
        if (truoc.isEmpty()) {
            return after;
        }
        HanhDongQuanTri action = deckAction(before, after);
        boolean reasonRequired = action == HanhDongQuanTri.CHUYEN_VE_NHAP
                || action == HanhDongQuanTri.AN_BO_MAU
                || action == HanhDongQuanTri.HIEN_BO_MAU;
        if (reasonRequired && request.lyDo() == null) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "lyDo", "Nhập lý do từ 10 đến 500 ký tự");
        }
        audit.record(actorId, action, LoaiDoiTuong.BO_THE, id, after.ten(), request.lyDo(), truoc, sau);
        return after;
    }

    @Transactional
    public void delete(Long actorId, Long id, DeleteSampleDeckRequest request) {
        SampleDeckResponse before = samples.delete(id, request.version());
        audit.record(actorId, HanhDongQuanTri.XOA_BO_MAU, LoaiDoiTuong.BO_THE, id, before.ten(), request.lyDo(),
                deckFields(before), null);
    }

    public PageResponse<CardResponse> cards(Long deckId, int page, int size) {
        samples.get(deckId);
        return cards.list(samples.ownerId(), deckId, page, size);
    }

    @Transactional
    public CardResponse createCard(Long actorId, Long deckId, CreateCardRequest request) {
        SampleDeckResponse deck = samples.lock(deckId);
        CardResponse card = cards.create(samples.ownerId(), actorId, deckId, request);
        audit.record(actorId, HanhDongQuanTri.TAO_THE_MAU, LoaiDoiTuong.THE_TU_VUNG, Long.valueOf(card.id()),
                cardName(card, deck), null, null, withoutFileIds(cardFields(card)));
        return card;
    }

    @Transactional
    public CardResponse updateCard(Long actorId, Long cardId, UpdateCardRequest request) {
        SampleDeckResponse deck = samples.lock(cards.deckIdOf(cardId));
        Long ownerId = samples.ownerId();
        CardResponse before = cards.get(ownerId, cardId);
        CardResponse after = cards.update(ownerId, actorId, cardId, request);
        Map<String, Object> truoc = cardFields(before);
        Map<String, Object> sau = cardFields(after);
        truoc.keySet().removeIf(key -> Objects.equals(truoc.get(key), sau.get(key)));
        sau.keySet().retainAll(truoc.keySet());
        if (!truoc.isEmpty()) {
            audit.record(actorId, HanhDongQuanTri.SUA_THE_MAU, LoaiDoiTuong.THE_TU_VUNG, cardId,
                    cardName(after, deck), null, withoutFileIds(truoc), withoutFileIds(sau));
        }
        return after;
    }

    @Transactional
    public void deleteCard(Long actorId, Long cardId, Long version) {
        SampleDeckResponse deck = samples.lock(cards.deckIdOf(cardId));
        Long ownerId = samples.ownerId();
        CardResponse before = cards.get(ownerId, cardId);
        if (deck.quyenTruyCap() == QuyenTruyCap.CONG_KHAI && deck.soThe() <= 1) {
            throw new ApiException(ErrorCode.BUSINESS_RULE,
                    "Bộ đang xuất bản cần ít nhất một thẻ. Chuyển bộ về bản nháp trước khi xóa thẻ cuối");
        }
        cards.delete(ownerId, cardId, version);
        audit.record(actorId, HanhDongQuanTri.XOA_THE_MAU, LoaiDoiTuong.THE_TU_VUNG, cardId,
                cardName(before, deck), null, withoutFileIds(cardFields(before)), null);
    }

    private static HanhDongQuanTri deckAction(SampleDeckResponse before, SampleDeckResponse after) {
        if (before.trangThaiKiemDuyet() != after.trangThaiKiemDuyet()) {
            return after.trangThaiKiemDuyet() == TrangThaiKiemDuyet.DA_AN
                    ? HanhDongQuanTri.AN_BO_MAU
                    : HanhDongQuanTri.HIEN_BO_MAU;
        }
        if (before.quyenTruyCap() != after.quyenTruyCap()) {
            return after.quyenTruyCap() == QuyenTruyCap.CONG_KHAI
                    ? HanhDongQuanTri.XUAT_BAN_BO_MAU
                    : HanhDongQuanTri.CHUYEN_VE_NHAP;
        }
        return HanhDongQuanTri.SUA_BO_MAU;
    }

    private static Map<String, Object> deckFields(SampleDeckResponse deck) {
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("ten", deck.ten());
        fields.put("moTa", deck.moTa());
        fields.put("mucTieu", deck.mucTieu());
        fields.put("chuDeId", deck.chuDeId());
        fields.put("trinhDo", deck.trinhDo());
        fields.put("quyenTruyCap", deck.quyenTruyCap());
        fields.put("trangThaiKiemDuyet", deck.trangThaiKiemDuyet());
        return fields;
    }

    private static Map<String, Object> cardFields(CardResponse card) {
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("tu", card.tu());
        fields.put("tuLoai", card.tuLoai());
        fields.put("nghiaVi", card.nghiaVi());
        fields.put("phienAm", card.phienAm());
        fields.put("viDuEn", card.viDuEn());
        fields.put("dichVi", card.dichVi());
        fields.put("doKho", card.doKho());
        fields.put("nguon", card.nguon());
        fields.put("nhanIds", card.nhanIds().stream().sorted().toList());
        fields.put("anhId", card.anhId());
        fields.put("amTuId", card.amTuId());
        fields.put("amCauId", card.amCauId());
        return fields;
    }

    private static Map<String, Object> withoutFileIds(Map<String, Object> fields) {
        Map<String, Object> result = new LinkedHashMap<>();
        fields.forEach((key, value) -> {
            if (FILE_FIELDS.containsKey(key)) {
                result.put(FILE_FIELDS.get(key), value != null);
            } else {
                result.put(key, value);
            }
        });
        return result;
    }

    private static String cardName(CardResponse card, SampleDeckResponse deck) {
        return card.tu() + " (" + deck.ten() + ")";
    }
}
