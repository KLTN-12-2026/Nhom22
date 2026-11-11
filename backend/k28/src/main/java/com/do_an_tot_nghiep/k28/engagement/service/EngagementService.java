package com.do_an_tot_nghiep.k28.engagement.service;

import com.do_an_tot_nghiep.k28.account.service.AccountService;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import com.do_an_tot_nghiep.k28.engagement.config.RewardProperties;
import com.do_an_tot_nghiep.k28.engagement.dto.BadgeResponse;
import com.do_an_tot_nghiep.k28.engagement.dto.ChallengeResponse;
import com.do_an_tot_nghiep.k28.engagement.dto.RewardHistoryQuery;
import com.do_an_tot_nghiep.k28.engagement.dto.RewardHistoryResponse;
import com.do_an_tot_nghiep.k28.engagement.entity.NguoiDungHuyHieu;
import com.do_an_tot_nghiep.k28.engagement.entity.TienDoThuThach;
import com.do_an_tot_nghiep.k28.engagement.mapper.EngagementMapper;
import com.do_an_tot_nghiep.k28.engagement.repository.HuyHieuRepository;
import com.do_an_tot_nghiep.k28.engagement.repository.NguoiDungHuyHieuRepository;
import com.do_an_tot_nghiep.k28.engagement.repository.SoDiemThuongRepository;
import com.do_an_tot_nghiep.k28.engagement.repository.ThuThachRepository;
import com.do_an_tot_nghiep.k28.engagement.repository.TienDoThuThachRepository;
import com.do_an_tot_nghiep.k28.learning.service.StreakCalculator;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EngagementService {

    private final Clock clock;
    private final AccountService accountService;
    private final RewardProperties properties;
    private final SoDiemThuongRepository ledger;
    private final HuyHieuRepository badges;
    private final NguoiDungHuyHieuRepository earned;
    private final ThuThachRepository challenges;
    private final TienDoThuThachRepository challengeProgress;
    private final EngagementMapper mapper;

    @Transactional(readOnly = true)
    public RewardHistoryResponse history(Long userId, RewardHistoryQuery query) {
        LocalDate homNay = today(userId);
        return new RewardHistoryResponse(
                ledger.totalPoints(userId),
                ledger.dayPoints(userId, homNay),
                properties.diemToiDaNgay(),
                PageResponse.of(ledger
                        .findByNguoiDungIdOrderByCreatedAtDescIdDesc(
                                userId, PageRequest.of(query.page(), query.size()))
                        .map(mapper::toResponse)));
    }

    @Transactional(readOnly = true)
    public List<BadgeResponse> badges(Long userId) {
        Map<Long, Instant> nhanAt = earned.findByNguoiDungId(userId).stream()
                .collect(Collectors.toMap(NguoiDungHuyHieu::getHuyHieuId, NguoiDungHuyHieu::getNhanAt));
        return badges.findByHoatDongTrueOrderByThuTuAscIdAsc().stream()
                .map(badge -> mapper.toResponse(badge, nhanAt.get(badge.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ChallengeResponse> challenges(Long userId) {
        LocalDate tuanBatDau = StreakCalculator.weekStart(today(userId));
        LocalDate tuanKetThuc = tuanBatDau.plusDays(6);
        Map<Long, TienDoThuThach> tienDo = challengeProgress.findByNguoiDungIdAndTuanBatDau(userId, tuanBatDau)
                .stream()
                .collect(Collectors.toMap(TienDoThuThach::getThuThachId, Function.identity()));
        return challenges.findByHoatDongTrueOrderByIdAsc().stream()
                .map(challenge -> mapper.toResponse(
                        challenge, tienDo.get(challenge.getId()), tuanBatDau, tuanKetThuc))
                .toList();
    }

    private LocalDate today(Long userId) {
        return LocalDate.ofInstant(clock.instant(), accountService.zoneOf(userId));
    }
}
