package com.do_an_tot_nghiep.k28.ai.service;

import com.do_an_tot_nghiep.k28.ai.client.ImageClient;
import com.do_an_tot_nghiep.k28.ai.client.ImageResult;
import com.do_an_tot_nghiep.k28.ai.config.ImageProperties;
import com.do_an_tot_nghiep.k28.ai.entity.YeuCauAi;
import com.do_an_tot_nghiep.k28.ai.repository.YeuCauAiRepository;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.job.JobException;
import com.do_an_tot_nghiep.k28.common.job.JobException.Kieu;
import com.do_an_tot_nghiep.k28.common.job.JobHandler;
import com.do_an_tot_nghiep.k28.common.job.KetQuaTacVu;
import com.do_an_tot_nghiep.k28.common.job.entity.TacVuNen;
import com.do_an_tot_nghiep.k28.common.storage.StorageService;
import com.do_an_tot_nghiep.k28.content.service.FileService;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.json.JsonMapper;

@Slf4j
@Component
@RequiredArgsConstructor
public class CardImageJobHandler implements JobHandler {

    public static final String LOAI = "AI_ANH_THE";
    static final String PNG = "image/png";
    private static final byte[] PNG_SIGNATURE = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};

    private final YeuCauAiRepository requests;
    private final ImageClient client;
    private final ImageProperties props;
    private final StorageService storage;
    private final FileService files;
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
        Long userId = tx.execute(status -> {
            YeuCauAi request = requests.findForUpdate(yeuCauId)
                    .orElseThrow(() -> new JobException(Kieu.LOI, "KHONG_TIM_THAY"));
            if (request.daKetThuc()) {
                throw new JobException(Kieu.LOI, "DA_KET_THUC");
            }
            request.batDauXuLy();
            return request.getNguoiDungId();
        });
        Instant start = clock.instant();
        ImageResult image;
        try {
            image = client.taoAnh(prompt(payload.tu(), payload.nghia()));
        } catch (JobException e) {
            int thoiLuong = elapsed(start);
            tx.executeWithoutResult(status -> requests.findForUpdate(yeuCauId).ifPresent(y -> y.ghiThoiLuong(thoiLuong)));
            throw e;
        }
        int thoiLuong = elapsed(start);
        tx.executeWithoutResult(status -> requests.findForUpdate(yeuCauId).ifPresent(y ->
                y.ghiCuocGoi(image.model(), image.providerRequestId(), thoiLuong, null, null)));
        byte[] png = image.png();
        if (png == null || png.length <= PNG_SIGNATURE.length || png.length > props.maxBytes()
                || !Arrays.equals(png, 0, PNG_SIGNATURE.length, PNG_SIGNATURE, 0, PNG_SIGNATURE.length)) {
            throw new JobException(Kieu.LOI, "ANH_KHONG_HOP_LE");
        }
        String objectKey = storage.newObjectKey("files/ai-images/" + userId);
        try {
            storage.putVerified(objectKey, png, PNG);
        } catch (ApiException e) {
            throw new JobException(Kieu.THU_LAI, "LUU_TRU");
        }
        try {
            tx.executeWithoutResult(status -> {
                Long tepId = files.createGeneratedImage(userId, objectKey, PNG, png);
                requests.findForUpdate(yeuCauId).ifPresent(y ->
                        y.luuKetQua(json.writeValueAsString(Map.of("tepId", tepId.toString()))));
            });
        } catch (RuntimeException e) {
            try {
                storage.delete(objectKey);
            } catch (RuntimeException cleanup) {
                log.warn("Generated image object for request {} will be removed by cleanup", yeuCauId);
            }
            throw e;
        }
    }

    @Override
    public void khiKetThuc(TacVuNen job, KetQuaTacVu ketQua) {
        finisher.finish(payload(job).yeuCauId(), ketQua);
    }

    static String prompt(String tu, String nghia) {
        String base = "Simple flat illustration for the English vocabulary word \"" + AiTaskPrompt.sanitize(tu)
                + "\" on a plain light background, no text, no letters, safe for all ages.";
        return nghia == null || nghia.isBlank()
                ? base
                : base + " Vietnamese meaning: " + AiTaskPrompt.sanitize(nghia) + ".";
    }

    private int elapsed(Instant start) {
        return (int) Math.min(Integer.MAX_VALUE, Math.max(0, Duration.between(start, clock.instant()).toMillis()));
    }

    private AiTaskPayload payload(TacVuNen job) {
        return json.readValue(job.getPayloadJson(), AiTaskPayload.class);
    }
}
