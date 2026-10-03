package com.do_an_tot_nghiep.k28.account.service;

import com.do_an_tot_nghiep.k28.account.dto.LearningSettingsRequest;
import com.do_an_tot_nghiep.k28.account.dto.LearningSettingsResponse;
import com.do_an_tot_nghiep.k28.account.dto.NotificationSettingsRequest;
import com.do_an_tot_nghiep.k28.account.dto.NotificationSettingsResponse;
import com.do_an_tot_nghiep.k28.account.dto.UpdateProfileRequest;
import com.do_an_tot_nghiep.k28.account.dto.UserResponse;
import com.do_an_tot_nghiep.k28.account.entity.CaiDatThongBao;
import com.do_an_tot_nghiep.k28.account.entity.HoSoHocTap;
import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.mapper.SettingsMapper;
import com.do_an_tot_nghiep.k28.account.repository.CaiDatThongBaoRepository;
import com.do_an_tot_nghiep.k28.account.repository.HoSoHocTapRepository;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import java.time.ZoneId;
import java.util.List;
import java.util.Objects;

import com.do_an_tot_nghiep.k28.content.service.TopicService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SettingsService {

    private final NguoiDungRepository users;
    private final HoSoHocTapRepository profiles;
    private final CaiDatThongBaoRepository notificationSettings;
    private final SettingsMapper settingsMapper;
    private final AccountService accountService;
    private final TopicService topicService;

    @Transactional
    public UserResponse updateProfile(Long userId, UpdateProfileRequest request) {
        NguoiDung user = users.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.UNAUTHENTICATED, "Bạn cần đăng nhập để tiếp tục"));
        user.updateProfile(request.tenHienThi(), request.muiGio() == null ? null : timeZone(request.muiGio()));
        return accountService.toResponse(user);
    }

    @Transactional
    public LearningSettingsResponse learning(Long userId) {
        return settingsMapper.toResponse(profileOf(userId));
    }

    @Transactional
    public LearningSettingsResponse updateLearning(
            Long userId,
            LearningSettingsRequest request
    ) {
        HoSoHocTap hoSo = profileOf(userId);
        checkVersion(hoSo.getVersion(), request.version());

        List<Long> topicIds =
                topicService.validateSelectedTopics(request.chuDeIds());

        hoSo.updateLearning(
                request.trinhDo(),
                request.mucTieu(),
                request.phutMoiNgay(),
                request.tuMoiMoiNgay()
        );
        hoSo.replaceTopics(topicIds);

        return settingsMapper.toResponse(profiles.saveAndFlush(hoSo));
    }

    @Transactional
    public NotificationSettingsResponse notification(Long userId) {
        return settingsMapper.toResponse(notificationOf(userId));
    }

    @Transactional
    public NotificationSettingsResponse updateNotification(Long userId, NotificationSettingsRequest request) {
        if (request.nhacHoc() && request.gioNhac() == null) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "gioNhac", "Chọn giờ nhắc học");
        }
        CaiDatThongBao caiDat = notificationOf(userId);
        checkVersion(caiDat.getVersion(), request.version());
        caiDat.update(request.nhanTrongUngDung(), request.nhanEmail(), request.nhacHoc(), request.gioNhac());
        return settingsMapper.toResponse(notificationSettings.saveAndFlush(caiDat));
    }


    private HoSoHocTap profileOf(Long userId) {
        return profiles.findById(userId)
                .orElseGet(() -> profiles.saveAndFlush(HoSoHocTap.defaultFor(userId)));
    }

    private CaiDatThongBao notificationOf(Long userId) {
        return notificationSettings.findById(userId)
                .orElseGet(() -> notificationSettings.saveAndFlush(CaiDatThongBao.defaultFor(userId)));
    }

    private static void checkVersion(Long current, Long expected) {
        if (!Objects.equals(current, expected)) {
            throw new ApiException(ErrorCode.VERSION_CONFLICT, "Thiết lập đã được thay đổi ở nơi khác, vui lòng tải lại");
        }
    }

    private static String timeZone(String muiGio) {
        if (!ZoneId.getAvailableZoneIds().contains(muiGio)) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "muiGio", "Múi giờ không hợp lệ");
        }
        return muiGio;
    }
}
