package com.do_an_tot_nghiep.k28.common.quota;

import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.quota.entity.enums.LoaiDichVu;
import com.do_an_tot_nghiep.k28.common.quota.repository.HanMucDichVuRepository;
import com.do_an_tot_nghiep.k28.common.quota.repository.SuDungDichVuRepository;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import com.do_an_tot_nghiep.k28.common.quota.entity.HanMucDichVu;
import com.do_an_tot_nghiep.k28.common.quota.entity.SuDungDichVu;
import java.util.Arrays;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuotaService {

    private final SuDungDichVuRepository usage;
    private final HanMucDichVuRepository limits;
    private final GoiDichVuResolver plans;
    private final QuotaProperties props;
    private final Clock clock;

    @Transactional(propagation = Propagation.MANDATORY)
    public GiuCho giuCho(Long nguoiDungId, LoaiDichVu loai) {
        Instant now = clock.instant();
        LocalDate ngay = now.atZone(props.zone()).toLocalDate();
        int gioiHan = gioiHan(nguoiDungId, loai);
        usage.taoNeuChuaCo(nguoiDungId, ngay, loai.name(), now);
        if (usage.giuCho(nguoiDungId, ngay, loai.name(), gioiHan, now) == 0) {
            Instant nuaDem = ngay.plusDays(1).atStartOfDay(props.zone()).toInstant();
            throw new ApiException(ErrorCode.RATE_LIMITED,
                    "Bạn đã dùng hết lượt " + switch (loai) {
                        case AI -> "AI";
                        case ANH -> "tạo ảnh AI";
                        case TTS -> "giọng đọc mẫu";
                        case PHAT_AM -> "đánh giá phát âm";
                        case LUYEN_TAP -> "tạo bài luyện tập";
                    } + " hôm nay, vui lòng thử lại vào ngày mai",
                    Math.max(1, Duration.between(now, nuaDem).getSeconds()),
                    Map.of("quyenLoi", "HAN_MUC", "loai", loai.name(), "gioiHan", gioiHan));
        }
        return new GiuCho(ngay, loai);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void xacNhan(Long nguoiDungId, GiuCho giuCho) {
        if (usage.xacNhan(nguoiDungId, giuCho.ngay(), giuCho.loai().name(), clock.instant()) == 0) {
            log.warn("Quota confirm found no reservation: user {} {} {}", nguoiDungId, giuCho.ngay(), giuCho.loai());
        }
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void hoanTra(Long nguoiDungId, GiuCho giuCho) {
        if (usage.hoanTra(nguoiDungId, giuCho.ngay(), giuCho.loai().name(), clock.instant()) == 0) {
            log.warn("Quota refund found no reservation: user {} {} {}", nguoiDungId, giuCho.ngay(), giuCho.loai());
        }
    }

    @Transactional(readOnly = true)
    public Map<LoaiDichVu, Integer> hanMucNgay(String goiMa) {
        Map<LoaiDichVu, Integer> result = new EnumMap<>(LoaiDichVu.class);
        limits.findByGoiMa(goiMa).forEach(hanMuc -> result.put(hanMuc.getLoai(), hanMuc.getSoLuotNgay()));
        return result;
    }

    @Transactional(readOnly = true)
    public ServiceQuotaResponse status(Long nguoiDungId) {
        Instant now = clock.instant();
        LocalDate ngay = now.atZone(props.zone()).toLocalDate();
        String goiMa = plans.goiMa(nguoiDungId);
        Map<LoaiDichVu, Integer> hanMuc = goiMa == null ? Map.of() : hanMucNgay(goiMa);
        Map<LoaiDichVu, SuDungDichVu> daDung = usage.findByNguoiDungIdAndNgay(nguoiDungId, ngay).stream()
                .collect(Collectors.toMap(SuDungDichVu::getLoai, Function.identity()));
        List<ServiceQuotaResponse.HanMuc> items = Arrays.stream(LoaiDichVu.values())
                .map(loai -> {
                    int gioiHan = hanMuc.getOrDefault(loai, 0);
                    SuDungDichVu dong = daDung.get(loai);
                    int soDung = dong == null ? 0 : dong.getSoDung();
                    int soGiu = dong == null ? 0 : dong.getSoGiu();
                    return new ServiceQuotaResponse.HanMuc(loai, gioiHan, soDung, soGiu,
                            Math.max(0, gioiHan - soDung - soGiu));
                })
                .toList();
        return new ServiceQuotaResponse(goiMa, ngay, ngay.plusDays(1).atStartOfDay(props.zone()).toInstant(), items);
    }

    @Transactional(readOnly = true)
    public List<ServiceQuotaItem> allLimits() {
        return limits.findAllByOrderByGoiMaAscLoaiAsc().stream()
                .map(hanMuc -> new ServiceQuotaItem(String.valueOf(hanMuc.getId()), hanMuc.getGoiMa(),
                        hanMuc.getLoai(), hanMuc.getSoLuotNgay(), hanMuc.getVersion()))
                .toList();
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public Integer updateLimit(String goiMa, LoaiDichVu loai, int soLuotNgay, long version) {
        HanMucDichVu hanMuc = limits.findByGoiMaAndLoai(goiMa, loai)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND,
                        "Không tìm thấy hạn mức " + loai + " của gói " + goiMa));
        if (hanMuc.getVersion() != version) {
            throw new ApiException(ErrorCode.VERSION_CONFLICT,
                    "Hạn mức " + loai + " của gói " + goiMa + " đã được người khác sửa, vui lòng tải lại");
        }
        int truoc = hanMuc.getSoLuotNgay();
        if (truoc == soLuotNgay) {
            return null;
        }
        hanMuc.doiSoLuot(soLuotNgay);
        limits.flush();
        return truoc;
    }

    public Long limitId(String goiMa, LoaiDichVu loai) {
        return limits.findByGoiMaAndLoai(goiMa, loai).map(HanMucDichVu::getId).orElseThrow();
    }

    @Transactional(readOnly = true)
    public Map<LoaiDichVu, UsageTotal> usageTotals(LocalDate tuNgay, LocalDate denNgay) {
        Map<LoaiDichVu, UsageTotal> result = new EnumMap<>(LoaiDichVu.class);
        usage.totals(tuNgay, denNgay).forEach(row -> result.put(row.getLoai(),
                new UsageTotal(row.getSoLuotDung(), row.getSoDangGiu(), row.getSoNguoiDung())));
        return result;
    }

    public ZoneId zone() {
        return props.zone();
    }

    public LocalDate today() {
        return clock.instant().atZone(props.zone()).toLocalDate();
    }

    public record UsageTotal(long soLuotDung, long soDangGiu, long soNguoiDung) {
    }

    private int gioiHan(Long nguoiDungId, LoaiDichVu loai) {
        String goiMa = plans.goiMa(nguoiDungId);
        return limits.findByGoiMaAndLoai(goiMa, loai)
                .map(hanMuc -> hanMuc.getSoLuotNgay())
                .orElseGet(() -> {
                    log.warn("No quota configured for plan {} and type {}", goiMa, loai);
                    return 0;
                });
    }
}
