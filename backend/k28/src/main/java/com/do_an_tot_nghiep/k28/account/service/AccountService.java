package com.do_an_tot_nghiep.k28.account.service;

import com.do_an_tot_nghiep.k28.account.dto.NotificationContact;
import com.do_an_tot_nghiep.k28.account.dto.ReminderTarget;
import com.do_an_tot_nghiep.k28.account.dto.UserResponse;
import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.entity.enums.TrangThaiNguoiDung;
import com.do_an_tot_nghiep.k28.account.mapper.UserMapper;
import com.do_an_tot_nghiep.k28.account.repository.CaiDatThongBaoRepository;
import com.do_an_tot_nghiep.k28.account.repository.HoSoHocTapRepository;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;

import java.time.ZoneId;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final NguoiDungRepository users;
    private final HoSoHocTapRepository profile;
    private final UserMapper userMapper;
    private final CaiDatThongBaoRepository notificationSettings;

    @Transactional(readOnly = true)
    public UserResponse me(Long userId) {
        NguoiDung user = users.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.UNAUTHENTICATED, "Bạn cần đăng nhập để tiếp tục"));
        return toResponse(user);
    }

    @Transactional(readOnly = true)
    public ZoneId zoneOf(Long userId) {
        NguoiDung user = users.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.UNAUTHENTICATED, "Bạn cần đăng nhập để tiếp tục"));
        return ZoneId.of(user.getMuiGio());
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void changeAvatar(Long userId, Long fileId) {
        lockedUser(userId).changeAvatar(fileId);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void clearAvatarIfMatches(Long userId, Long fileId) {
        NguoiDung user = lockedUser(userId);
        if (fileId.equals(user.getAnhDaiDienId())) {
            user.changeAvatar(null);
        }
    }

    @Transactional
    public void clearAvatar(Long userId) {
        lockedUser(userId).changeAvatar(null);
    }

    @Transactional(readOnly = true)
    public Long avatarId(Long userId) {
        return users.findById(userId).orElseThrow(() ->
                new ApiException(ErrorCode.UNAUTHENTICATED, "Bạn cần đăng nhập để tiếp tục"))
                .getAnhDaiDienId();
    }

    @Transactional(readOnly = true)
    public Long visibleAvatarId(Long userId) {
        return users.findById(userId).map(NguoiDung::visibleAvatarId).orElse(null);
    }

    @Transactional(readOnly = true)
    public Long publicAvatarId(Long userId) {
        return users.findById(userId)
                .filter(user -> user.getTrangThai() == TrangThaiNguoiDung.HOAT_DONG)
                .map(NguoiDung::visibleAvatarId)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public boolean isUnavailable(Long userId) {
        return users.findById(userId)
                .map(user -> user.getTrangThai() == TrangThaiNguoiDung.BI_KHOA
                        || user.getTrangThai() == TrangThaiNguoiDung.DANG_XOA)
                .orElse(false);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> reportSnapshot(Long reporterId, Long targetId) {
        if (targetId.equals(reporterId)) {
            throw new ApiException(ErrorCode.BUSINESS_RULE, "Không thể báo cáo chính bạn");
        }
        NguoiDung user = users.findById(targetId)
                .filter(found -> found.getTrangThai() == TrangThaiNguoiDung.HOAT_DONG)
                .filter(found -> !AccountAdminService.SYSTEM_EMAIL.equals(found.getEmail()))
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Người dùng không khả dụng"));
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("ten", user.getTenHienThi());
        snapshot.put("tenHienThi", user.getTenHienThi());
        Long avatar = user.visibleAvatarId();
        snapshot.put("anhDaiDienId", avatar == null ? null : String.valueOf(avatar));
        snapshot.put("thamGiaAt", user.getCreatedAt() == null ? null : user.getCreatedAt().toString());
        return snapshot;
    }

    private NguoiDung lockedUser(Long userId) {
        return users.findForUpdate(userId).orElseThrow(() ->
                new ApiException(ErrorCode.UNAUTHENTICATED, "Bạn cần đăng nhập để tiếp tục"));
    }

    UserResponse toResponse(NguoiDung user) {
        return userMapper.toResponse(user, profile.findById(user.getId()).orElse(null));
    }

    @Transactional(readOnly = true)
    public Map<Long, String> publicDisplayNames(Collection<Long> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }

        return users.findPublicDisplayName(ids).stream()
                .collect(Collectors.toMap(
                        NguoiDungRepository.PublicDisplayName::getId,
                        NguoiDungRepository.PublicDisplayName::getTenHienThi
                ));
    }

    @Transactional(readOnly = true)
    public Set<Long> adminIds(Collection<Long> ids) {
        if (ids.isEmpty()) {
            return Set.of();
        }
        return users.findAllById(ids).stream()
                .filter(user -> user.hasRole("ADMIN"))
                .map(NguoiDung::getId)
                .collect(java.util.stream.Collectors.toUnmodifiableSet());
    }

    @Transactional(readOnly = true)
    public Set<Long> activeIds(Collection<Long> ids) {
        if (ids.isEmpty()) {
            return Set.of();
        }
        return Set.copyOf(users.findIdsByTrangThai(ids, TrangThaiNguoiDung.HOAT_DONG));
    }

    @Transactional(readOnly = true)
    public List<ReminderTarget> reminderTargets() {
        return notificationSettings.reminderTargets(TrangThaiNguoiDung.HOAT_DONG);
    }

    @Transactional(readOnly = true)
    public Map<Long, NotificationContact> contacts(Collection<Long> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        return notificationSettings.contacts(ids).stream()
                .collect(Collectors.toMap(NotificationContact::id, contact -> contact));
    }
}
