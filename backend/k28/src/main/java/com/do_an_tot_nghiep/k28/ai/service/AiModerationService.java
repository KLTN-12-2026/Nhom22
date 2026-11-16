package com.do_an_tot_nghiep.k28.ai.service;

import com.do_an_tot_nghiep.k28.ai.dto.AiRequestResponse;
import com.do_an_tot_nghiep.k28.ai.entity.YeuCauAi;
import com.do_an_tot_nghiep.k28.ai.entity.enums.TrangThaiYeuCauAi;
import com.do_an_tot_nghiep.k28.ai.repository.YeuCauAiRepository;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import java.util.LinkedHashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AiModerationService {

    private final YeuCauAiRepository requests;
    private final CardDraftService cardDrafts;

    @Transactional(readOnly = true)
    public Map<String, Object> reportSnapshot(Long userId, Long id) {
        YeuCauAi yeuCau = requests.findByIdAndNguoiDungId(id, userId)
                .filter(found -> !found.isAnKiemDuyet())
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy yêu cầu AI"));
        if (yeuCau.getTrangThai() != TrangThaiYeuCauAi.HOAN_TAT) {
            throw new ApiException(ErrorCode.BUSINESS_RULE, "Chỉ báo cáo được đầu ra AI đã hoàn tất");
        }
        AiRequestResponse detail = cardDrafts.get(userId, id);
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("ten", yeuCau.getLoai() + ": " + yeuCau.getInputRef());
        snapshot.put("loai", yeuCau.getLoai());
        snapshot.put("inputRef", yeuCau.getInputRef());
        snapshot.put("nhaCungCap", yeuCau.getNhaCungCap());
        snapshot.put("model", yeuCau.getModel());
        snapshot.put("phienBanPrompt", yeuCau.getPhienBanPrompt());
        snapshot.put("ketQua", detail.ketQua());
        snapshot.put("banNhap", detail.banNhap());
        return snapshot;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public Boolean moderate(Long id, boolean hide) {
        return requests.findForUpdate(id)
                .map(yeuCau -> {
                    boolean before = yeuCau.isAnKiemDuyet();
                    if (hide && !before) {
                        yeuCau.hideByModeration();
                        requests.flush();
                    }
                    return before;
                })
                .orElse(null);
    }
}
