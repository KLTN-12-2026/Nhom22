package com.do_an_tot_nghiep.k28.ai.service;

import com.do_an_tot_nghiep.k28.ai.dto.CardDraftCommitRequest;
import com.do_an_tot_nghiep.k28.ai.dto.CardDraftCommitResponse;
import com.do_an_tot_nghiep.k28.ai.dto.CardDraftCommitResponse.ResultItem;
import com.do_an_tot_nghiep.k28.ai.config.AiProperties;
import com.do_an_tot_nghiep.k28.ai.dto.CardDraftData;
import com.do_an_tot_nghiep.k28.ai.dto.CardDraftEdit;
import com.do_an_tot_nghiep.k28.ai.entity.BanNhapTheAi;
import com.do_an_tot_nghiep.k28.ai.entity.YeuCauAi;
import com.do_an_tot_nghiep.k28.ai.entity.enums.LoaiYeuCauAi;
import com.do_an_tot_nghiep.k28.ai.entity.enums.TrangThaiDuyet;
import com.do_an_tot_nghiep.k28.ai.entity.enums.TrangThaiYeuCauAi;
import com.do_an_tot_nghiep.k28.ai.repository.BanNhapTheAiRepository;
import com.do_an_tot_nghiep.k28.ai.repository.CardDraftCommitRepository;
import com.do_an_tot_nghiep.k28.ai.repository.YeuCauAiRepository;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.content.service.CardDraftTargetService;
import java.time.Clock;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

@Service
@RequiredArgsConstructor
public class CardDraftCommitService {

    private static final Pattern KEY = Pattern.compile("[A-Za-z0-9._:-]{1,128}");

    private final CardDraftCommitRepository commits;
    private final YeuCauAiRepository requests;
    private final BanNhapTheAiRepository drafts;
    private final CardDraftTargetService targets;
    private final CardDraftService cardDrafts;
    private final CardDraftParser parser;
    private final AiProperties props;
    private final JsonMapper json;
    private final Clock clock;

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public CardDraftCommitResponse commit(Long userId, Long yeuCauId, String key, CardDraftCommitRequest request) {
        if (key == null || !KEY.matcher(key).matches()) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "Idempotency-Key",
                    "Gửi Idempotency-Key từ 1 đến 128 ký tự ASCII hợp lệ");
        }
        List<Long> ids = request.banNhapIds().stream().map(Long::valueOf).sorted().toList();
        if (new HashSet<>(ids).size() != ids.size()) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "banNhapIds", "Các thẻ nháp không được trùng nhau");
        }
        boolean existingDeck = request.boTheId() != null;
        boolean newDeck = request.tenBoMoi() != null && !request.tenBoMoi().isBlank();
        if (existingDeck == newDeck) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "boTheId",
                    "Chọn bộ thẻ có sẵn hoặc nhập tên bộ mới, không chọn cả hai");
        }
        Map<Long, CardDraftData> edits = edits(request, ids);
        String hash = CardDraftService.sha256(yeuCauId + ":" + ids + ":"
                + (existingDeck ? "deck:" + request.boTheId() : "new:" + request.tenBoMoi())
                + ":" + json.writeValueAsString(new TreeMap<>(edits)));

        var previous = commits.find(userId, key);
        if (previous.isPresent()) {
            return replay(previous.get(), yeuCauId, hash);
        }
        YeuCauAi yeuCau = requests.findOwnedForUpdate(yeuCauId, userId)
                .filter(found -> found.getLoai() == LoaiYeuCauAi.TAO_THE)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy yêu cầu AI"));
        var entry = commits.reserveAndLock(userId, key, yeuCauId, hash, clock.instant());
        if (entry.completed()) {
            return replay(entry, yeuCauId, hash);
        }
        check(entry, yeuCauId, hash);
        if (yeuCau.getTrangThai() != TrangThaiYeuCauAi.HOAN_TAT) {
            throw new ApiException(ErrorCode.BUSINESS_RULE, "Yêu cầu AI chưa tạo xong thẻ nháp");
        }
        List<BanNhapTheAi> selected = drafts.findByYeuCauIdAndIdInOrderByThuTu(yeuCauId, ids);
        if (selected.size() != ids.size()) {
            throw new ApiException(ErrorCode.NOT_FOUND, "banNhapIds", "Không tìm thấy thẻ nháp");
        }
        if (selected.stream().anyMatch(draft -> draft.getTrangThaiDuyet() != TrangThaiDuyet.CHO_DUYET)) {
            throw new ApiException(ErrorCode.CONFLICT, "banNhapIds", "Có thẻ nháp đã được lưu trước đó");
        }

        Long deckId = existingDeck
                ? targets.lockOwnedDeck(userId, Long.valueOf(request.boTheId()))
                : targets.createPrivateDeck(userId, request.tenBoMoi());
        Map<String, List<Long>> index = targets.termIndex(userId, deckId);
        List<ResultItem> results = new ArrayList<>();
        for (BanNhapTheAi draft : selected) {
            CardDraftData data = edits.get(draft.getId());
            if (data == null) {
                data = cardDrafts.read(draft);
            } else {
                draft.suaNoiDung(json.writeValueAsString(data));
            }
            List<Long> existing = index.getOrDefault(CardDraftTargetService.termKey(data.tu()), List.of());
            Long theId = targets.createCard(deckId, data.tu(), data.tuLoai(), data.nghiaVi(), data.viDuEn(), data.dichVi());
            draft.daLuu(theId);
            results.add(new ResultItem(draft.getId().toString(), theId.toString(), !existing.isEmpty(),
                    existing.stream().map(String::valueOf).toList()));
        }
        var response = new CardDraftCommitResponse(yeuCauId.toString(), deckId.toString(), newDeck,
                results.size(), List.copyOf(results));
        commits.complete(entry.id(), deckId, json.writeValueAsString(response), clock.instant());
        return response;
    }

    private Map<Long, CardDraftData> edits(CardDraftCommitRequest request, List<Long> ids) {
        Map<Long, CardDraftData> edits = new HashMap<>();
        for (CardDraftEdit edit : request.sua() == null ? List.<CardDraftEdit>of() : request.sua()) {
            Long id = Long.valueOf(edit.banNhapId());
            if (!ids.contains(id) || edits.containsKey(id)) {
                throw new ApiException(ErrorCode.VALIDATION_FAILED, "sua",
                        "Chỉ sửa thẻ nháp đang chọn, mỗi thẻ một lần");
            }
            CardDraftData data = parser.kiemTraSua(edit, props.cardDraft().maxTuMoiThe());
            if (data == null) {
                throw new ApiException(ErrorCode.VALIDATION_FAILED, "sua",
                        "Từ chỉ gồm chữ cái, khoảng trắng, dấu nháy hoặc gạch nối, tối đa "
                                + props.cardDraft().maxTuMoiThe() + " từ; không dùng ký tự < > { }");
            }
            edits.put(id, data);
        }
        return edits;
    }

    private CardDraftCommitResponse replay(CardDraftCommitRepository.Entry entry, Long yeuCauId, String hash) {
        check(entry, yeuCauId, hash);
        if (!entry.completed() || entry.responseJson() == null) {
            throw new ApiException(ErrorCode.CONFLICT, "Idempotency-Key", "Yêu cầu lưu thẻ đang được xử lý");
        }
        return json.readValue(entry.responseJson(), CardDraftCommitResponse.class);
    }

    private void check(CardDraftCommitRepository.Entry entry, Long yeuCauId, String hash) {
        if (!entry.yeuCauId().equals(yeuCauId) || !entry.hash().equals(hash)) {
            throw new ApiException(ErrorCode.CONFLICT, "Idempotency-Key", "Idempotency-Key đã dùng cho yêu cầu khác");
        }
    }
}
