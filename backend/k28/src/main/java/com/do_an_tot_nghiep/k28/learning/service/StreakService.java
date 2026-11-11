package com.do_an_tot_nghiep.k28.learning.service;

import com.do_an_tot_nghiep.k28.learning.repository.SuDungHocNgayRepository;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StreakService {

    public static final int LUOT_TOI_THIEU_CHUOI = 5;
    static final int SO_NGAY_TOI_DA = 1000;

    private final SuDungHocNgayRepository usage;

    @Transactional(readOnly = true)
    public StreakCalculator.Result of(Long userId, LocalDate homNay) {
        return StreakCalculator.calculate(
                usage.qualifyingDays(userId, LUOT_TOI_THIEU_CHUOI, PageRequest.ofSize(SO_NGAY_TOI_DA)),
                homNay);
    }
}
