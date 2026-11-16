package com.do_an_tot_nghiep.k28.admin.service;

import com.do_an_tot_nghiep.k28.admin.dto.ServiceUsageResponse;
import com.do_an_tot_nghiep.k28.admin.dto.UpdateServiceQuotasRequest;
import com.do_an_tot_nghiep.k28.admin.entity.enums.HanhDongQuanTri;
import com.do_an_tot_nghiep.k28.admin.entity.enums.LoaiDoiTuong;
import com.do_an_tot_nghiep.k28.ai.dto.AiFailureCount;
import com.do_an_tot_nghiep.k28.ai.service.AiTaskService;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.quota.QuotaService;
import com.do_an_tot_nghiep.k28.common.quota.ServiceQuotaItem;
import com.do_an_tot_nghiep.k28.common.quota.entity.enums.LoaiDichVu;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminServiceOpsService {

    static final int SO_NGAY_MAC_DINH = 7;
    static final int SO_NGAY_TOI_DA = 90;
    private static final Set<LoaiDichVu> CO_GHI_LOI = EnumSet.of(LoaiDichVu.AI, LoaiDichVu.ANH);

    private final QuotaService quota;
    private final AiTaskService aiTasks;
    private final AuditService audit;

    public List<ServiceQuotaItem> quotas() {
        return quota.allLimits();
    }

    @Transactional
    public List<ServiceQuotaItem> updateQuotas(Long adminId, UpdateServiceQuotasRequest request) {
        Set<String> seen = new HashSet<>();
        for (UpdateServiceQuotasRequest.HanMuc item : request.hanMuc()) {
            if (!seen.add(item.goiMa().strip() + ":" + item.loai())) {
                throw new ApiException(ErrorCode.VALIDATION_FAILED, "hanMuc",
                        "Hạn mức " + item.loai() + " của gói " + item.goiMa().strip() + " bị gửi trùng");
            }
        }
        for (UpdateServiceQuotasRequest.HanMuc item : request.hanMuc()) {
            String goiMa = item.goiMa().strip();
            Integer truoc = quota.updateLimit(goiMa, item.loai(), item.soLuotNgay(), item.version());
            if (truoc != null) {
                audit.record(adminId, HanhDongQuanTri.SUA_HAN_MUC, LoaiDoiTuong.HAN_MUC_DICH_VU,
                        quota.limitId(goiMa, item.loai()), goiMa + " · " + item.loai(), request.lyDo(),
                        Map.of("soLuotNgay", truoc), Map.of("soLuotNgay", item.soLuotNgay()));
            }
        }
        return quota.allLimits();
    }

    public ServiceUsageResponse usage(String tuNgayText, String denNgayText) {
        LocalDate homNay = quota.today();
        LocalDate denNgay = denNgayText == null ? homNay : parseDate(denNgayText, "denNgay");
        LocalDate tuNgay = tuNgayText == null ? denNgay.minusDays(SO_NGAY_MAC_DINH - 1) : parseDate(tuNgayText, "tuNgay");
        if (tuNgay.isAfter(denNgay)) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "denNgay", "Ngày kết thúc phải từ ngày bắt đầu trở đi");
        }
        if (ChronoUnit.DAYS.between(tuNgay, denNgay) >= SO_NGAY_TOI_DA) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "tuNgay", "Chọn khoảng tối đa 90 ngày");
        }
        Map<LoaiDichVu, QuotaService.UsageTotal> totals = quota.usageTotals(tuNgay, denNgay);
        Map<LoaiDichVu, AiFailureCount> failures = aiTasks.failures(tuNgay, denNgay);
        List<ServiceUsageResponse.DichVu> dichVu = Arrays.stream(LoaiDichVu.values())
                .map(loai -> {
                    QuotaService.UsageTotal total = totals.getOrDefault(loai, new QuotaService.UsageTotal(0, 0, 0));
                    AiFailureCount failure = failures.getOrDefault(loai, new AiFailureCount(0, 0));
                    boolean coGhiLoi = CO_GHI_LOI.contains(loai);
                    return new ServiceUsageResponse.DichVu(loai, total.soLuotDung(), total.soDangGiu(),
                            total.soNguoiDung(), coGhiLoi ? failure.soLoi() : null,
                            coGhiLoi ? failure.soKhongXacDinh() : null);
                })
                .toList();
        return new ServiceUsageResponse(quota.zone().getId(), tuNgay, denNgay, dichVu);
    }

    private static LocalDate parseDate(String value, String field) {
        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException exception) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, field, "Ngày không hợp lệ");
        }
    }
}
