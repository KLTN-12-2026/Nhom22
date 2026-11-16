package com.do_an_tot_nghiep.k28.ai.service;

import com.do_an_tot_nghiep.k28.ai.client.AiClient;
import com.do_an_tot_nghiep.k28.ai.client.ImageClient;
import com.do_an_tot_nghiep.k28.ai.dto.AiHistoryItem;
import com.do_an_tot_nghiep.k28.ai.dto.AiHistoryQuery;
import com.do_an_tot_nghiep.k28.ai.dto.AiRequestAcceptedResponse;
import com.do_an_tot_nghiep.k28.ai.dto.CardImageRequest;
import com.do_an_tot_nghiep.k28.ai.dto.ContextExplanationRequest;
import com.do_an_tot_nghiep.k28.ai.dto.SentenceFeedbackRequest;
import com.do_an_tot_nghiep.k28.ai.entity.YeuCauAi;
import com.do_an_tot_nghiep.k28.ai.entity.enums.LoaiYeuCauAi;
import com.do_an_tot_nghiep.k28.ai.mapper.AiRequestMapper;
import com.do_an_tot_nghiep.k28.ai.repository.YeuCauAiRepository;
import com.do_an_tot_nghiep.k28.common.job.JobService;
import com.do_an_tot_nghiep.k28.common.quota.GiuCho;
import com.do_an_tot_nghiep.k28.common.quota.QuotaService;
import com.do_an_tot_nghiep.k28.common.quota.entity.enums.LoaiDichVu;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import com.do_an_tot_nghiep.k28.ai.dto.AiFailureCount;
import java.time.LocalDate;
import java.util.EnumMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AiTaskService {

    public static final String PHIEN_BAN_ANH = "card-image-v1";

    private final YeuCauAiRepository requests;
    private final QuotaService quota;
    private final JobService jobs;
    private final AiClient aiClient;
    private final ImageClient imageClient;
    private final AiRequestMapper mapper;

    @Transactional
    public AiRequestAcceptedResponse explain(Long userId, ContextExplanationRequest request) {
        String nguCanh = request.nguCanh() == null || request.nguCanh().isBlank() ? null : request.nguCanh();
        return enqueue(userId, LoaiYeuCauAi.NGU_CANH, LoaiDichVu.AI, AiTaskPrompt.PHIEN_BAN_NGU_CANH,
                aiClient.nhaCungCap(), AiTaskJobHandler.LOAI,
                request.tu().strip(), nguCanh, null, null);
    }

    @Transactional
    public AiRequestAcceptedResponse feedback(Long userId, SentenceFeedbackRequest request) {
        return enqueue(userId, LoaiYeuCauAi.SUA_CAU, LoaiDichVu.AI, AiTaskPrompt.PHIEN_BAN_SUA_CAU,
                aiClient.nhaCungCap(), AiTaskJobHandler.LOAI,
                request.tu().strip(), null, request.cau().strip(), null);
    }

    @Transactional
    public AiRequestAcceptedResponse image(Long userId, CardImageRequest request) {
        String nghia = request.nghia() == null || request.nghia().isBlank() ? null : request.nghia().strip();
        return enqueue(userId, LoaiYeuCauAi.ANH_THE, LoaiDichVu.ANH, PHIEN_BAN_ANH,
                imageClient.nhaCungCap(), CardImageJobHandler.LOAI,
                request.tu().strip(), null, null, nghia);
    }

    @Transactional(readOnly = true)
    public PageResponse<AiHistoryItem> history(Long userId, AiHistoryQuery query) {
        LoaiYeuCauAi loai = query.loai();
        PageRequest pageable = PageRequest.of(query.page(), query.size(),
                Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")));
        return PageResponse.of((loai == null
                ? requests.findByNguoiDungId(userId, pageable)
                : requests.findByNguoiDungIdAndLoai(userId, loai, pageable)).map(mapper::toHistory));
    }

    @Transactional(readOnly = true)
    public Map<LoaiDichVu, AiFailureCount> failures(LocalDate tuNgay, LocalDate denNgay) {
        Map<LoaiDichVu, AiFailureCount> result = new EnumMap<>(LoaiDichVu.class);
        requests.failures(tuNgay, denNgay).forEach(row -> result.put(row.getLoai(),
                new AiFailureCount(row.getSoLoi(), row.getSoKhongXacDinh())));
        return result;
    }

    private AiRequestAcceptedResponse enqueue(Long userId, LoaiYeuCauAi loai, LoaiDichVu hanMuc, String phienBan,
                                              String nhaCungCap, String jobLoai,
                                              String tu, String nguCanh, String cau, String nghia) {
        GiuCho giuCho = quota.giuCho(userId, hanMuc);
        YeuCauAi yeuCau = requests.saveAndFlush(YeuCauAi.moi(userId, loai, tu, phienBan, nhaCungCap, giuCho));
        jobs.enqueue(jobLoai, new AiTaskPayload(yeuCau.getId(), tu, nguCanh, cau, nghia));
        return new AiRequestAcceptedResponse(yeuCau.getId().toString(), yeuCau.getTrangThai());
    }
}
