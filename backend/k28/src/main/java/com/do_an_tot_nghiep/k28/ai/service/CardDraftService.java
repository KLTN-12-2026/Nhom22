package com.do_an_tot_nghiep.k28.ai.service;

import com.do_an_tot_nghiep.k28.ai.client.AiClient;
import com.do_an_tot_nghiep.k28.ai.config.AiProperties;
import com.do_an_tot_nghiep.k28.ai.dto.AiRequestAcceptedResponse;
import com.do_an_tot_nghiep.k28.ai.dto.AiRequestResponse;
import com.do_an_tot_nghiep.k28.ai.dto.CardDraftData;
import com.do_an_tot_nghiep.k28.ai.dto.CardDraftResponse;
import com.do_an_tot_nghiep.k28.ai.dto.CreateCardDraftRequest;
import com.do_an_tot_nghiep.k28.ai.entity.BanNhapTheAi;
import com.do_an_tot_nghiep.k28.ai.entity.YeuCauAi;
import com.do_an_tot_nghiep.k28.ai.entity.enums.TrangThaiYeuCauAi;
import com.do_an_tot_nghiep.k28.ai.mapper.AiRequestMapper;
import com.do_an_tot_nghiep.k28.ai.repository.BanNhapTheAiRepository;
import com.do_an_tot_nghiep.k28.ai.repository.YeuCauAiRepository;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.job.JobService;
import com.do_an_tot_nghiep.k28.common.quota.GiuCho;
import com.do_an_tot_nghiep.k28.common.quota.QuotaService;
import com.do_an_tot_nghiep.k28.common.quota.entity.enums.LoaiDichVu;
import com.do_an_tot_nghiep.k28.content.service.CardDraftTargetService;
import com.do_an_tot_nghiep.k28.content.service.FileService;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.json.JsonMapper;

@Service
@RequiredArgsConstructor
public class CardDraftService {

    private final YeuCauAiRepository requests;
    private final BanNhapTheAiRepository drafts;
    private final QuotaService quota;
    private final JobService jobs;
    private final FileService files;
    private final CardDraftTargetService targets;
    private final AiClient client;
    private final AiProperties props;
    private final AiRequestMapper mapper;
    private final TransactionTemplate tx;
    private final JsonMapper json;

    public AiRequestAcceptedResponse create(Long userId, CreateCardDraftRequest request) {
        AiProperties.CardDraft limits = props.cardDraft();
        String doanVan = request.doanVan() == null || request.doanVan().isBlank() ? null : request.doanVan();
        Long tepId = request.tepId() == null ? null : Long.valueOf(request.tepId());
        if ((doanVan == null) == (tepId == null)) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "doanVan",
                    "Gửi đoạn văn hoặc tệp Word, không gửi cả hai");
        }
        if (doanVan != null && doanVan.codePointCount(0, doanVan.length()) > limits.maxKyTu()) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "doanVan",
                    "Đoạn văn tối đa " + limits.maxKyTu() + " ký tự");
        }
        Long boTheId = request.boTheId() == null ? null : Long.valueOf(request.boTheId());
        if (tepId != null) {
            files.requireDocument(userId, tepId, limits.maxTepBytes());
        }
        if (boTheId != null) {
            targets.requireOwnedDeck(userId, boTheId);
        }
        String inputRef = doanVan != null ? "TEXT:" + sha256(doanVan).substring(0, 16) : "FILE:" + tepId;
        return tx.execute(status -> {
            GiuCho giuCho = quota.giuCho(userId, LoaiDichVu.AI);
            YeuCauAi yeuCau = requests.saveAndFlush(YeuCauAi.taoThe(userId, inputRef, limits.phienBanPrompt(),
                    client.nhaCungCap(), giuCho));
            jobs.enqueue(CardDraftJobHandler.LOAI, new CardDraftPayload(yeuCau.getId(), doanVan, tepId, boTheId));
            return new AiRequestAcceptedResponse(yeuCau.getId().toString(), yeuCau.getTrangThai());
        });
    }

    @Transactional(readOnly = true)
    public AiRequestResponse get(Long userId, Long id) {
        YeuCauAi yeuCau = requests.findByIdAndNguoiDungId(id, userId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy yêu cầu AI"));
        List<CardDraftResponse> banNhap = yeuCau.getTrangThai() == TrangThaiYeuCauAi.HOAN_TAT
                ? drafts.findByYeuCauIdOrderByThuTu(id).stream().map(draft -> mapper.toResponse(draft, read(draft))).toList()
                : List.of();
        return mapper.toResponse(yeuCau, banNhap);
    }

    public CardDraftData read(BanNhapTheAi draft) {
        return json.readValue(draft.getNoiDungJson(), CardDraftData.class);
    }

    static String sha256(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
