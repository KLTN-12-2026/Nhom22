package com.do_an_tot_nghiep.k28.billing.service;

import com.do_an_tot_nghiep.k28.billing.config.BillingProperties;
import com.do_an_tot_nghiep.k28.billing.dto.KyDoanhThu;
import com.do_an_tot_nghiep.k28.billing.dto.RevenueQuery;
import com.do_an_tot_nghiep.k28.billing.dto.RevenueResponse;
import com.do_an_tot_nghiep.k28.billing.entity.GoiDichVu;
import com.do_an_tot_nghiep.k28.billing.entity.enums.TrangThaiDangKy;
import com.do_an_tot_nghiep.k28.billing.entity.enums.TrangThaiGiaoDich;
import com.do_an_tot_nghiep.k28.billing.repository.DangKyGoiRepository;
import com.do_an_tot_nghiep.k28.billing.repository.GiaoDichThanhToanRepository;
import com.do_an_tot_nghiep.k28.billing.repository.GoiDichVuRepository;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RevenueService {

    static final int SO_NAM_MAC_DINH = 5;

    private final GiaoDichThanhToanRepository giaoDich;
    private final DangKyGoiRepository dangKyGoi;
    private final GoiDichVuRepository goiDichVu;
    private final BillingProperties props;
    private final Clock clock;

    @Transactional(readOnly = true)
    public RevenueResponse revenue(RevenueQuery query) {
        ZoneId zone = props.businessZone();
        Instant now = clock.instant();
        int namNay = now.atZone(zone).getYear();
        Integer nam = null;
        Integer tuNam = null;
        Integer denNam = null;
        List<LocalDate> moc = new ArrayList<>();
        List<String> nhan = new ArrayList<>();
        LocalDate kyTruocTu;
        if (query.ky() == KyDoanhThu.NAM) {
            denNam = query.denNam() != null ? query.denNam()
                    : query.tuNam() != null ? Math.max(query.tuNam(), namNay) : namNay;
            tuNam = query.tuNam() != null ? query.tuNam() : denNam - SO_NAM_MAC_DINH + 1;
            for (int y = tuNam; y <= denNam; y++) {
                moc.add(LocalDate.of(y, 1, 1));
                nhan.add(String.valueOf(y));
            }
            moc.add(LocalDate.of(denNam + 1, 1, 1));
            kyTruocTu = LocalDate.of(tuNam - (denNam - tuNam + 1), 1, 1);
        } else {
            nam = query.nam() != null ? query.nam() : namNay;
            int buoc = query.ky() == KyDoanhThu.THANG ? 1 : 3;
            for (int thang = 1; thang <= 12; thang += buoc) {
                moc.add(LocalDate.of(nam, thang, 1));
                nhan.add(query.ky() == KyDoanhThu.THANG ? "Tháng " + thang : "Quý " + ((thang - 1) / 3 + 1));
            }
            moc.add(LocalDate.of(nam + 1, 1, 1));
            kyTruocTu = LocalDate.of(nam - 1, 1, 1);
        }
        LocalDate dau = moc.getFirst();
        LocalDate cuoi = moc.getLast();
        List<String> maGoi = goiDichVu.findAllByOrderByGiaThangAsc().stream().map(GoiDichVu::getMa).toList();

        long[] doanhThu = new long[nhan.size()];
        long[] soGiaoDich = new long[nhan.size()];
        List<Map<String, Long>> theoGoi = new ArrayList<>();
        for (int i = 0; i < nhan.size(); i++) {
            Map<String, Long> goi = new LinkedHashMap<>();
            maGoi.forEach(ma -> goi.put(ma, 0L));
            theoGoi.add(goi);
        }
        for (var row : giaoDich.revenueRows(start(dau, zone), start(cuoi, zone))) {
            LocalDate ngay = row.getHoanTatAt().atZone(zone).toLocalDate();
            int i = index(moc, ngay);
            doanhThu[i] += row.getSoTien();
            soGiaoDich[i]++;
            theoGoi.get(i).merge(row.getGoiMa(), row.getSoTien(), Long::sum);
        }
        List<RevenueResponse.Ky> cacKy = new ArrayList<>();
        long tong = 0;
        long soGd = 0;
        for (int i = 0; i < nhan.size(); i++) {
            cacKy.add(new RevenueResponse.Ky(nhan.get(i), moc.get(i), moc.get(i + 1).minusDays(1), doanhThu[i],
                    soGiaoDich[i], theoGoi.get(i)));
            tong += doanhThu[i];
            soGd += soGiaoDich[i];
        }
        long kyTruoc = giaoDich.revenueRows(start(kyTruocTu, zone), start(dau, zone)).stream()
                .mapToLong(GiaoDichThanhToanRepository.RevenueRow::getSoTien).sum();

        Map<TrangThaiGiaoDich, Long> trangThai = giaoDich.statusCounts(start(dau, zone), start(cuoi, zone)).stream()
                .collect(Collectors.toMap(GiaoDichThanhToanRepository.StatusCount::getTrangThai,
                        GiaoDichThanhToanRepository.StatusCount::getSoLuong));
        long thanhCong = trangThai.getOrDefault(TrangThaiGiaoDich.THANH_CONG, 0L);
        long ketThuc = thanhCong + trangThai.getOrDefault(TrangThaiGiaoDich.THAT_BAI, 0L)
                + trangThai.getOrDefault(TrangThaiGiaoDich.HET_HAN, 0L);
        RevenueResponse.TongQuan tongQuan = new RevenueResponse.TongQuan(
                dangKyGoi.countByTrangThaiAndHetHanAtAfter(TrangThaiDangKy.HIEU_LUC, now),
                dangKyGoi.countByTrangThaiAndHetHanAtAfterAndHetHanAtLessThanEqual(TrangThaiDangKy.HIEU_LUC, now,
                        now.plus(Duration.ofDays(7))),
                ketThuc == 0 ? null : percent(thanhCong, ketThuc));
        return new RevenueResponse(query.ky(), nam, tuNam, denNam, tong, soGd,
                kyTruoc == 0 ? null : percent(tong - kyTruoc, kyTruoc), cacKy, tongQuan);
    }

    private static Instant start(LocalDate date, ZoneId zone) {
        return date.atStartOfDay(zone).toInstant();
    }

    private static int index(List<LocalDate> moc, LocalDate ngay) {
        int i = moc.size() - 2;
        while (i > 0 && ngay.isBefore(moc.get(i))) {
            i--;
        }
        return i;
    }

    private static double percent(long tu, long mau) {
        return Math.round(tu * 1000.0 / mau) / 10.0;
    }
}
