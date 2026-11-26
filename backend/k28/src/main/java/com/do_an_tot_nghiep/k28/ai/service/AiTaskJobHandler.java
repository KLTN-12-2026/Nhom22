package com.do_an_tot_nghiep.k28.ai.service;

import com.do_an_tot_nghiep.k28.ai.client.AiClient;
import com.do_an_tot_nghiep.k28.ai.client.AiRequest;
import com.do_an_tot_nghiep.k28.ai.client.AiResponse;
import com.do_an_tot_nghiep.k28.ai.entity.YeuCauAi;
import com.do_an_tot_nghiep.k28.ai.entity.enums.LoaiYeuCauAi;
import com.do_an_tot_nghiep.k28.ai.repository.YeuCauAiRepository;
import com.do_an_tot_nghiep.k28.common.job.JobException;
import com.do_an_tot_nghiep.k28.common.job.JobException.Kieu;
import com.do_an_tot_nghiep.k28.common.job.JobHandler;
import com.do_an_tot_nghiep.k28.common.job.KetQuaTacVu;
import com.do_an_tot_nghiep.k28.common.job.entity.TacVuNen;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.json.JsonMapper;

@Component
@RequiredArgsConstructor
public class AiTaskJobHandler implements JobHandler {

    public static final String LOAI = "AI_TAC_VU";

    private final YeuCauAiRepository requests;
    private final AiClient client;
    private final AiTaskPrompt prompt;
    private final AiTaskParser parser;
    private final AiRequestFinisher finisher;
    private final TransactionTemplate tx;
    private final JsonMapper json;
    private final Clock clock;

    @Override
    public String loai() {
        return LOAI;
    }

    @Override
    public void xuLy(TacVuNen job) {
        AiTaskPayload payload = payload(job);
        Long yeuCauId = payload.yeuCauId();
        LoaiYeuCauAi loai = tx.execute(status -> {
            YeuCauAi request = requests.findForUpdate(yeuCauId)
                    .orElseThrow(() -> new JobException(Kieu.LOI, "KHONG_TIM_THAY"));
            if (request.daKetThuc()) {
                throw new JobException(Kieu.LOI, "DA_KET_THUC");
            }
            request.batDauXuLy();
            return request.getLoai();
        });
        AiRequest request = switch (loai) {
            case NGU_CANH -> prompt.nguCanh(payload.tu(), payload.nguCanh());
            case SUA_CAU -> prompt.suaCau(payload.tu(), payload.cau());
            case GIAI_THICH_LOI -> prompt.giaiThichLoi(payload.tu(), payload.nghia(), payload.loaiCau(),
                    payload.nguCanh(), payload.dapAn(), payload.cau());
            default -> throw new JobException(Kieu.LOI, "LOAI_KHONG_HO_TRO");
        };
        Instant start = clock.instant();
        AiResponse response;
        try {
            response = client.taoNoiDung(request);
        } catch (JobException e) {
            int thoiLuong = elapsed(start);
            tx.executeWithoutResult(status -> requests.findForUpdate(yeuCauId).ifPresent(y -> y.ghiThoiLuong(thoiLuong)));
            throw e;
        }
        int thoiLuong = elapsed(start);
        tx.executeWithoutResult(status -> requests.findForUpdate(yeuCauId).ifPresent(y -> y.ghiCuocGoi(
                response.model(), response.providerRequestId(), thoiLuong, response.tokenVao(), response.tokenRa())));
        Object ketQua = switch (loai) {
            case NGU_CANH -> parser.nguCanh(response.noiDung());
            case GIAI_THICH_LOI -> parser.giaiThichLoi(response.noiDung());
            default -> parser.suaCau(response.noiDung());
        };
        String ketQuaJson = json.writeValueAsString(ketQua);
        tx.executeWithoutResult(status -> requests.findForUpdate(yeuCauId).ifPresent(y -> y.luuKetQua(ketQuaJson)));
    }

    @Override
    public void khiKetThuc(TacVuNen job, KetQuaTacVu ketQua) {
        finisher.finish(payload(job).yeuCauId(), ketQua);
    }

    private int elapsed(Instant start) {
        return (int) Math.min(Integer.MAX_VALUE, Math.max(0, Duration.between(start, clock.instant()).toMillis()));
    }

    private AiTaskPayload payload(TacVuNen job) {
        return json.readValue(job.getPayloadJson(), AiTaskPayload.class);
    }
}
