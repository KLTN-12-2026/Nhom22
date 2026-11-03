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
    public LoginResult login(LoginRequest request, String clientIp) {
        String email = Emails.normalize(request.email());
        String emailKey = emailKey(email);
        String ipKey = "ip:" + clientIp;
        String limitKey = pairKey(email, clientIp);
        rateLimiter.requireBelow(RateLimiter.Policy.LOGIN_IP, ipKey);
        rateLimiter.requireBelow(RateLimiter.Policy.LOGIN_EMAIL, emailKey);
        rateLimiter.check(RateLimiter.Policy.LOGIN, limitKey);

        NguoiDung user = users.findByEmail(email).orElse(null);

        boolean hasPassword = user != null && user.getPasswordHash() != null;
        boolean matches = passwordEncoder.matches(request.password(), hasPassword ? user.getPasswordHash() : DUMMY_HASH);

        if (!hasPassword || !matches) {
            rateLimiter.hit(RateLimiter.Policy.LOGIN_IP, ipKey);
            rateLimiter.hit(RateLimiter.Policy.LOGIN_EMAIL, emailKey);
            throw new ApiException(ErrorCode.INVALID_CREDENTIALS, "Sai email hoặc mật khẩu");
        }
        switch (user.getTrangThai()) {
            case CHUA_XAC_THUC -> throw new ApiException(ErrorCode.EMAIL_NOT_VERIFIED, "Tài khoản chưa xác thực email");
            case BI_KHOA, DANG_XOA -> throw new ApiException(ErrorCode.ACCOUNT_LOCKED, "Tài khoản đã bị khóa. Liên hệ với quản trị viên để được hỗ trợ");
            case HOAT_DONG -> {
            }
        }

        rateLimiter.reset(RateLimiter.Policy.LOGIN, limitKey);
        rateLimiter.reset(RateLimiter.Policy.LOGIN_EMAIL, emailKey);
        users.recordLogin(user.getId(), clock.instant());
        return new LoginResult(principalOf(user), accountService.toResponse(user));
    }

    static String emailKey(String email) {
        return "email:" + TokenService.sha256(email);
    }

    static String pairKey(String email, String clientIp) {
        return emailKey(email) + ":ip:" + clientIp;
    }

    static AuthUser principalOf(NguoiDung user) {
        return new AuthUser(user.getId(), user.getEmail(),
                user.getVaiTro().stream().map(VaiTro::getMa).collect(Collectors.toSet()));
    }
}
