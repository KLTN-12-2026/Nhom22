package com.do_an_tot_nghiep.k28.account.service;

import com.do_an_tot_nghiep.k28.account.dto.UserResponse;
import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.mapper.UserMapper;
import com.do_an_tot_nghiep.k28.account.repository.HoSoHocTapRepository;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final NguoiDungRepository users;
    private final HoSoHocTapRepository profile;
    private final UserMapper userMapper;

    @Transactional(readOnly = true)
    public UserResponse me(Long userId) {
        NguoiDung user = users.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.UNAUTHENTICATED, "Bạn cần đăng nhập để tiếp tục"));
        return toResponse(user);
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

    private NguoiDung lockedUser(Long userId) {
        return users.findForUpdate(userId).orElseThrow(() ->
                new ApiException(ErrorCode.UNAUTHENTICATED, "Bạn cần đăng nhập để tiếp tục"));
    }

    UserResponse toResponse(NguoiDung user) {
        return userMapper.toResponse(user, profile.findById(user.getId()).orElse(null));
    }


}
