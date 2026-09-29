package com.do_an_tot_nghiep.k28.account.service;

import com.do_an_tot_nghiep.k28.account.dto.LoginRequest;
import com.do_an_tot_nghiep.k28.account.dto.UserResponse;
import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.entity.VaiTro;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.security.AuthUser;
import com.do_an_tot_nghiep.k28.common.security.RateLimiter;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LoginService {

    private static final String DUMMY_HASH = new BCryptPasswordEncoder().encode("dummy-password-1");

    private final NguoiDungRepository users;
    private final AccountService accountService;
    private final PasswordEncoder passwordEncoder;
    private final RateLimiter rateLimiter;
    private final Clock clock;

    public record LoginResult(AuthUser principal, UserResponse user) {
    }

    @Transactional
    public LoginResult login(LoginRequest request) {
        String email = Emails.normalize(request.email());
        String limitKey = "email:" + TokenService.sha256(email);
        rateLimiter.check(RateLimiter.Policy.LOGIN, limitKey);

        NguoiDung user = users.findByEmail(email).orElse(null);

        boolean hasPassword = user != null && user.getPasswordHash() != null;
        boolean matches = passwordEncoder.matches(request.password(), hasPassword ? user.getPasswordHash() : DUMMY_HASH);

        if (!hasPassword || !matches) {
            throw new ApiException(ErrorCode.INVALID_CREDENTIALS, "Sai email hoặc mật khẩu");
        }
        switch (user.getTrangThai()) {
            case CHUA_XAC_THUC -> throw new ApiException(ErrorCode.EMAIL_NOT_VERIFIED, "Tài khoản chưa xác thực email");
            case BI_KHOA, DANG_XOA -> throw new ApiException(ErrorCode.ACCOUNT_LOCKED, "Tài khoản đã bị khóa. Liên hệ với quản trị viên để được hỗ trợ");
            case HOAT_DONG -> {

            }
        }

        rateLimiter.reset(RateLimiter.Policy.LOGIN, limitKey);
        user.recordLogin(clock.instant());
        AuthUser principal = new AuthUser(user.getId(), user.getEmail(),
                user.getVaiTro().stream().map(VaiTro::getMa).collect(Collectors.toSet()));

        return new LoginResult(principal, accountService.toResponse(user));
    }
}
