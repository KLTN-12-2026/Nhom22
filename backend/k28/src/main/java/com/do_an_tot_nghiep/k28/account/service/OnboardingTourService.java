package com.do_an_tot_nghiep.k28.account.service;

import com.do_an_tot_nghiep.k28.account.dto.OnboardingTourRequest;
import com.do_an_tot_nghiep.k28.account.dto.OnboardingTourResponse;
import com.do_an_tot_nghiep.k28.account.entity.HoSoHocTap;
import com.do_an_tot_nghiep.k28.account.entity.enums.BuocHuongDan;
import com.do_an_tot_nghiep.k28.account.repository.HoSoHocTapRepository;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.content.service.DeckCopyService;
import com.do_an_tot_nghiep.k28.content.service.SampleDeckService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

@Slf4j
@Service
@RequiredArgsConstructor
public class OnboardingTourService {

    private final HoSoHocTapRepository profiles;
    private final SampleDeckService samples;
    private final DeckCopyService copies;
    private final TransactionTemplate transactions;

    public OnboardingTourResponse tour(Long userId) {
        Long sourceId = samples.starterId().orElse(null);
        return transactions.execute(status -> toResponse(profileOf(userId), sourceId));
    }

    public OnboardingTourResponse start(Long userId) {
        Long sourceId = samples.starterId().orElse(null);
        Long starterCopyId = sourceId == null ? null : starterCopy(userId, sourceId);
        return transactions.execute(status -> {
            HoSoHocTap profile = profileOf(userId);
            profile.startTour(starterCopyId);
            return toResponse(profiles.saveAndFlush(profile), sourceId);
        });
    }

    public OnboardingTourResponse advance(Long userId, OnboardingTourRequest request) {
        Long copyId = request.boSaoChepId() == null ? null : Long.valueOf(request.boSaoChepId());
        if (copyId != null && !copies.ownsDeck(userId, copyId)) {
            throw new ApiException(ErrorCode.NOT_FOUND, "boSaoChepId", "Không tìm thấy bộ thẻ của bạn");
        }
        if (request.buocHuongDan() == BuocHuongDan.CHUA_BAT_DAU) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "buocHuongDan", "Dùng lệnh bắt đầu để chạy lại hướng dẫn");
        }
        Long sourceId = samples.starterId().orElse(null);
        return transactions.execute(status -> {
            HoSoHocTap profile = profileOf(userId);
            if (profile.advanceTour(request.buocHuongDan(), copyId)) {
                profiles.saveAndFlush(profile);
            }
            return toResponse(profile, sourceId);
        });
    }

    private Long starterCopy(Long userId, Long sourceId) {
        Long existing = existingCopy(userId, sourceId);
        if (existing != null) {
            return existing;
        }
        try {
            return Long.valueOf(copies.copy(userId, sourceId, "onboarding-" + UUID.randomUUID()).id());
        } catch (ApiException error) {
            log.info("Starter deck not copied for user {}: {}", userId, error.getMessage());
            return existingCopy(userId, sourceId);
        }
    }

    private Long existingCopy(Long userId, Long sourceId) {
        return copies.ownCopies(userId, List.of(sourceId)).stream()
                .findFirst()
                .map(copy -> Long.valueOf(copy.boTheId()))
                .orElse(null);
    }

    private HoSoHocTap profileOf(Long userId) {
        return profiles.findById(userId)
                .orElseGet(() -> profiles.saveAndFlush(HoSoHocTap.defaultFor(userId)));
    }

    private static OnboardingTourResponse toResponse(HoSoHocTap profile, Long sourceId) {
        return new OnboardingTourResponse(
                profile.getBuocHuongDan(),
                text(profile.getBoKhoiDongId()),
                text(profile.getBoSaoChepId()),
                text(sourceId)
        );
    }

    private static String text(Long id) {
        return id == null ? null : id.toString();
    }
}
