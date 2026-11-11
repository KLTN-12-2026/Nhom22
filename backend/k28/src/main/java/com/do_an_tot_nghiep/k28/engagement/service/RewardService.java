package com.do_an_tot_nghiep.k28.engagement.service;

import com.do_an_tot_nghiep.k28.engagement.config.RewardProperties;
import com.do_an_tot_nghiep.k28.engagement.entity.HuyHieu;
import com.do_an_tot_nghiep.k28.engagement.entity.NguoiDungHuyHieu;
import com.do_an_tot_nghiep.k28.engagement.entity.SoDiemThuong;
import com.do_an_tot_nghiep.k28.engagement.entity.ThuThach;
import com.do_an_tot_nghiep.k28.engagement.entity.TienDoThuThach;
import com.do_an_tot_nghiep.k28.engagement.entity.enums.LoaiDieuKienHuyHieu;
import com.do_an_tot_nghiep.k28.engagement.entity.enums.LoaiDieuKienThuThach;
import com.do_an_tot_nghiep.k28.engagement.entity.enums.LoaiSuKien;
import com.do_an_tot_nghiep.k28.engagement.repository.HuyHieuRepository;
import com.do_an_tot_nghiep.k28.engagement.repository.NguoiDungHuyHieuRepository;
import com.do_an_tot_nghiep.k28.engagement.repository.SoDiemThuongRepository;
import com.do_an_tot_nghiep.k28.engagement.repository.ThuThachRepository;
import com.do_an_tot_nghiep.k28.engagement.repository.TienDoThuThachRepository;
import com.do_an_tot_nghiep.k28.learning.service.DailyUsageService;
import com.do_an_tot_nghiep.k28.learning.service.StreakCalculator;
import com.do_an_tot_nghiep.k28.learning.service.StreakService;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RewardService {

    private final Clock clock;
    private final RewardProperties properties;
    private final SoDiemThuongRepository ledger;
    private final HuyHieuRepository badges;
    private final NguoiDungHuyHieuRepository earned;
    private final ThuThachRepository challenges;
    private final TienDoThuThachRepository challengeProgress;
    private final DailyUsageService dailyUsage;
    private final StreakService streakService;

    @Transactional(propagation = Propagation.MANDATORY)
    public int reviewed(Long userId, Long tienDoId, LocalDate ngay) {
        String suKienId = tienDoId + ":" + ngay;
        if (ledger.existsByNguoiDungIdAndLoaiSuKienAndSuKienId(userId, LoaiSuKien.ON_THE, suKienId)) {
            return 0;
        }
        Instant now = clock.instant();
        int granted = record(userId, LoaiSuKien.ON_THE, suKienId, properties.diemMoiLuotOn(), ngay);
        addChallengeProgress(userId, ngay, now);
        awardBadges(userId, ngay, now);
        return granted;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public int practiced(Long userId, Long lanLamBaiId, int soCauDung, boolean laLuyenLai, LocalDate ngay) {
        String suKienId = String.valueOf(lanLamBaiId);
        if (ledger.existsByNguoiDungIdAndLoaiSuKienAndSuKienId(userId, LoaiSuKien.BAI_LUYEN, suKienId)) {
            return 0;
        }
        int diemGoc = laLuyenLai ? 0 : soCauDung * properties.diemMoiCauDung();
        int granted = record(userId, LoaiSuKien.BAI_LUYEN, suKienId, diemGoc, ngay);
        awardBadges(userId, ngay, clock.instant());
        return granted;
    }

    private int record(Long userId, LoaiSuKien loai, String suKienId, int diemGoc, LocalDate ngay) {
        int granted = dailyUsage.grantPoints(userId, ngay, diemGoc, properties.diemToiDaNgay());
        ledger.saveAndFlush(SoDiemThuong.create(userId, loai, suKienId, diemGoc, granted, ngay));
        return granted;
    }

    private void addChallengeProgress(Long userId, LocalDate ngay, Instant now) {
        LocalDate tuan = StreakCalculator.weekStart(ngay);
        for (ThuThach challenge : challenges.findByHoatDongTrueOrderByIdAsc()) {
            if (challenge.getLoaiDieuKien() != LoaiDieuKienThuThach.LUOT_ON) {
                continue;
            }
            challengeProgress.ensureRow(userId, challenge.getId(), tuan, now);
            TienDoThuThach row = challengeProgress.lockRow(userId, challenge.getId(), tuan).orElseThrow();
            row.add(1, challenge.getMucTieu(), now);
            challengeProgress.saveAndFlush(row);
        }
    }

    private void awardBadges(Long userId, LocalDate ngay, Instant now) {
        Set<Long> owned = earned.findByNguoiDungId(userId).stream()
                .map(NguoiDungHuyHieu::getHuyHieuId)
                .collect(Collectors.toSet());
        List<HuyHieu> pending = badges.findByHoatDongTrueOrderByThuTuAscIdAsc().stream()
                .filter(badge -> !owned.contains(badge.getId()))
                .toList();
        Map<LoaiDieuKienHuyHieu, Long> values = new EnumMap<>(LoaiDieuKienHuyHieu.class);
        for (HuyHieu badge : pending) {
            long value = values.computeIfAbsent(badge.getLoaiDieuKien(), loai -> value(userId, loai, ngay));
            if (value >= badge.getNguong()) {
                earned.award(userId, badge.getId(), now);
            }
        }
    }

    private long value(Long userId, LoaiDieuKienHuyHieu loai, LocalDate ngay) {
        return switch (loai) {
            case TONG_LUOT_ON -> ledger.countByNguoiDungIdAndLoaiSuKien(userId, LoaiSuKien.ON_THE);
            case TONG_BAI_LUYEN -> ledger.countByNguoiDungIdAndLoaiSuKien(userId, LoaiSuKien.BAI_LUYEN);
            case TONG_DIEM -> ledger.totalPoints(userId);
            case CHUOI_NGAY -> streakService.of(userId, ngay).chuoiNgay();
        };
    }
}
