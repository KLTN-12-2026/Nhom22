package com.do_an_tot_nghiep.k28.ai.service;

import com.do_an_tot_nghiep.k28.ai.client.AiClient;
import com.do_an_tot_nghiep.k28.ai.client.AiRequest;
import com.do_an_tot_nghiep.k28.ai.client.AiResponse;
import com.do_an_tot_nghiep.k28.ai.config.AiProperties;
import com.do_an_tot_nghiep.k28.ai.dto.CardDraftData;
import com.do_an_tot_nghiep.k28.ai.entity.BanNhapTheAi;
import com.do_an_tot_nghiep.k28.ai.entity.YeuCauAi;
import com.do_an_tot_nghiep.k28.ai.entity.enums.TrangThaiHanMuc;
import com.do_an_tot_nghiep.k28.ai.entity.enums.TrangThaiYeuCauAi;
import com.do_an_tot_nghiep.k28.ai.repository.BanNhapTheAiRepository;
import com.do_an_tot_nghiep.k28.ai.repository.YeuCauAiRepository;
import com.do_an_tot_nghiep.k28.common.document.DocxTextReader;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.job.JobException;
import com.do_an_tot_nghiep.k28.common.job.JobException.Kieu;
import com.do_an_tot_nghiep.k28.common.job.JobHandler;
import com.do_an_tot_nghiep.k28.common.job.KetQuaTacVu;
import com.do_an_tot_nghiep.k28.common.job.entity.TacVuNen;
import com.do_an_tot_nghiep.k28.common.quota.QuotaService;
import com.do_an_tot_nghiep.k28.content.service.CardDraftTargetService;
import com.do_an_tot_nghiep.k28.content.service.FileService;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.json.JsonMapper;

@Component
@RequiredArgsConstructor
public class CardDraftJobHandler implements JobHandler {

    public static final String LOAI = "AI_TAO_THE";

    private final YeuCauAiRepository requests;
    private final BanNhapTheAiRepository drafts;
    private final AiClient client;
    private final CardDraftPrompt prompt;
    private final CardDraftParser parser;
    private final FileService files;
    private final DocxTextReader docx;
    private final CardDraftTargetService targets;
    private final QuotaService quota;
    private final AiProperties props;
    private final TransactionTemplate tx;
    private final JsonMapper json;
    private final Clock clock;

    @Override
    public String loai() {
        return LOAI;
    }

    @Override
    public void xuLy(TacVuNen job) {
        CardDraftPayload payload = payload(job);
        Long yeuCauId = payload.yeuCauId();
        Long userId = tx.execute(status -> {
            YeuCauAi request = requests.findForUpdate(yeuCauId)
                    .orElseThrow(() -> new JobException(Kieu.LOI, "KHONG_TIM_THAY"));
            if (request.daKetThuc()) {
                throw new JobException(Kieu.LOI, "DA_KET_THUC");
            }
            request.batDauXuLy();
            return request.getNguoiDungId();
        });
        String text = payload.doanVan() != null ? payload.doanVan() : document(userId, payload.tepId());
        AiRequest request = prompt.build(text);
        Instant start = clock.instant();
        AiResponse response;
        try {
            response = client.taoNoiDung(request);
        } catch (JobException e) {
            update(yeuCauId, yeuCau -> yeuCau.ghiThoiLuong(elapsed(start)));
            throw e;
        }
        update(yeuCauId, yeuCau -> yeuCau.ghiCuocGoi(response.model(), response.providerRequestId(),
                elapsed(start), response.tokenVao(), response.tokenRa()));
        AiProperties.CardDraft limits = props.cardDraft();
        CardDraftParser.KetQua parsed = parser.parse(response.noiDung(), limits.maxThe(), limits.maxTuMoiThe());
        Map<String, List<Long>> index = payload.boTheId() == null
                ? Map.of()
                : targets.termIndex(userId, payload.boTheId());
        tx.executeWithoutResult(status -> {
            drafts.deleteByYeuCau(yeuCauId);
            int thuTu = 1;
            int soTrung = 0;
            for (CardDraftData item : parsed.the()) {
                List<Long> existing = index.get(CardDraftTargetService.termKey(item.tu()));
                CardDraftData saved = existing == null || existing.isEmpty() ? item : item.danhDauTrung(existing.getFirst());
                soTrung += saved.trung() ? 1 : 0;
                drafts.save(BanNhapTheAi.moi(yeuCauId, thuTu++, json.writeValueAsString(saved)));
            }
            String summary = json.writeValueAsString(Map.of(
                    "soThe", parsed.the().size(), "soBoQua", parsed.soBoQua(), "soTrung", soTrung));
            requests.findForUpdate(yeuCauId).ifPresent(yeuCau -> yeuCau.luuKetQua(summary));
        });
    }

    @Override
    public void khiKetThuc(TacVuNen job, KetQuaTacVu ketQua) {
        requests.findForUpdate(payload(job).yeuCauId()).ifPresent(request -> {
            switch (ketQua.trangThai()) {
                case XONG -> {
                    request.ketThuc(TrangThaiYeuCauAi.HOAN_TAT, null);
                    if (request.chotHanMuc(TrangThaiHanMuc.DA_DUNG)) {
                        quota.xacNhan(request.getNguoiDungId(), request.giuCho());
                    }
                }
                case KHONG_XAC_DINH -> {
                    request.ketThuc(TrangThaiYeuCauAi.KHONG_XAC_DINH, ketQua.maLoi());
                    if (request.chotHanMuc(TrangThaiHanMuc.DA_DUNG)) {
                        quota.xacNhan(request.getNguoiDungId(), request.giuCho());
                    }
                }
                case LOI -> {
                    request.ketThuc(TrangThaiYeuCauAi.LOI, ketQua.maLoi());
                    if (request.chotHanMuc(TrangThaiHanMuc.DA_HOAN)) {
                        quota.hoanTra(request.getNguoiDungId(), request.giuCho());
                    }
                }
                default -> {
                }
            }
        });
    }

    private String document(Long userId, Long tepId) {
        AiProperties.CardDraft limits = props.cardDraft();
        byte[] content;
        try {
            content = files.readDocument(userId, tepId, limits.maxTepBytes());
        } catch (ApiException e) {
            if (e.getErrorCode() == ErrorCode.DEPENDENCY_DOWN) {
                throw new JobException(Kieu.THU_LAI, "LUU_TRU");
            }
            throw new JobException(Kieu.LOI, "TEP_KHONG_HOP_LE");
        }
        String text;
        try {
            text = docx.read(content);
        } catch (DocxTextReader.UnreadableDocumentException e) {
            throw new JobException(Kieu.LOI, "TEP_KHONG_HOP_LE");
        }
        if (text.isBlank()) {
            throw new JobException(Kieu.LOI, "TEP_RONG");
        }
        if (text.codePointCount(0, text.length()) > limits.maxKyTu()) {
            throw new JobException(Kieu.LOI, "TEP_QUA_DAI");
        }
        return text;
    }

    private void update(Long yeuCauId, Consumer<YeuCauAi> change) {
        tx.executeWithoutResult(status -> requests.findForUpdate(yeuCauId).ifPresent(change));
    }

    private int elapsed(Instant start) {
        return (int) Math.min(Integer.MAX_VALUE, Math.max(0, Duration.between(start, clock.instant()).toMillis()));
    }

    private CardDraftPayload payload(TacVuNen job) {
        return json.readValue(job.getPayloadJson(), CardDraftPayload.class);
    }
}
