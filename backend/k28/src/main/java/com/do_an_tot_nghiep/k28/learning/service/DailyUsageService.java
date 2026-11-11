package com.do_an_tot_nghiep.k28.learning.service;

import com.do_an_tot_nghiep.k28.learning.entity.SuDungHocNgay;
import com.do_an_tot_nghiep.k28.learning.repository.SuDungHocNgayRepository;
import java.time.Clock;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DailyUsageService {

    private final Clock clock;
    private final SuDungHocNgayRepository usage;

    @Transactional(propagation = Propagation.MANDATORY)
    public int grantPoints(Long userId, LocalDate ngay, int requested, int cap) {
        usage.ensureRow(userId, ngay, clock.instant());
        SuDungHocNgay day = usage.lockDay(userId, ngay).orElseThrow();
        int granted = day.addPoints(requested, cap);
        usage.saveAndFlush(day);
        return granted;
    }
}
