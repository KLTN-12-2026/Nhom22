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
                    } + " hôm nay, vui lòng thử lại vào ngày mai",
                    Math.max(1, Duration.between(now, nuaDem).getSeconds()));
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
