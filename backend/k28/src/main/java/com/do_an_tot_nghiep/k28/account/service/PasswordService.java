package com.do_an_tot_nghiep.k28.account.service;

import com.do_an_tot_nghiep.k28.account.dto.ChangePasswordRequest;
import com.do_an_tot_nghiep.k28.account.entity.LoaiToken;
import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.mail.MailService;
import com.do_an_tot_nghiep.k28.common.security.RateLimiter;
import com.do_an_tot_nghiep.k28.common.security.SessionRevoker;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.HtmlUtils;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;

@Service
@RequiredArgsConstructor
public class PasswordService {

    static final Duration RESET_TTL = Duration.ofMinutes(30);

    private final NguoiDungRepository users;
    private final TokenService tokenService;
    private final MailService mailService;
    private final RateLimiter rateLimiter;
    private final PasswordEncoder passwordEncoder;
    private final SessionRevoker sessionRevoker;
    private final Clock clock;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Transactional
    public void forgotPassword(String rawEmail, String clientIp) {
        String email = Emails.normalize(rawEmail);
        rateLimiter.check(RateLimiter.Policy.FORGOT_PASSWORD, "ip:" + clientIp);
        rateLimiter.check(RateLimiter.Policy.FORGOT_PASSWORD, "email:" + TokenService.sha256(email));

        users.findByEmail(email)
                .filter(NguoiDung::canResetPassword)
                .ifPresent(this::sendResetLink);
    }

    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        Long userId;
        try {
            userId = tokenService.consume(rawToken, LoaiToken.DAT_LAI_MAT_KHAU);
        } catch (ApiException ex) {
            throw invalidResetLink();
        }
        NguoiDung user = users.findById(userId)
                .filter(NguoiDung::canResetPassword)
                .orElseThrow(PasswordService::invalidResetLink);
        if (user.isUnverified()) {
            user.verifyEmail(clock.instant());
        }
        user.changePassword(passwordEncoder.encode(newPassword));
        rateLimiter.reset(RateLimiter.Policy.LOGIN, loginKey(user));
        sessionRevoker.revokeAll(user.getId(), null);
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request, String currentSessionId) {
        String limitKey = "user:" + userId;
        rateLimiter.check(RateLimiter.Policy.CHANGE_PASSWORD, limitKey);
        NguoiDung user = users.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.UNAUTHENTICATED, "Bạn cần đăng nhập để tiếp tục"));
        String currentHash = user.getPasswordHash();
        if (currentHash == null || !passwordEncoder.matches(request.currentPassword(), currentHash)) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "currentPassword", "Mật khẩu hiện tại không đúng");
        }
        if (passwordEncoder.matches(request.newPassword(), currentHash)) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "newPassword", "Mật khẩu mới phải khác mật khẩu hiện tại");
        }
        user.changePassword(passwordEncoder.encode(request.newPassword()));
        rateLimiter.reset(RateLimiter.Policy.CHANGE_PASSWORD, limitKey);
        sessionRevoker.revokeAll(userId, currentSessionId);
    }

    private static ApiException invalidResetLink() {
        return new ApiException(ErrorCode.TOKEN_INVALID, "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn");
    }

    private static String loginKey(NguoiDung user) {
        return "email:" + TokenService.sha256(user.getEmail());
    }

    private void sendResetLink(NguoiDung user) {
        String token = tokenService.issue(user.getId(), LoaiToken.DAT_LAI_MAT_KHAU, RESET_TTL);
        String link = frontendUrl + "/dat-lai-mat-khau?token=" + URLEncoder.encode(token, StandardCharsets.UTF_8);
        String html = "<p>Xin chào " + HtmlUtils.htmlEscape(user.getTenHienThi()) + ",</p>"
                + "<p>Nhấn vào liên kết sau để đặt lại mật khẩu VocabLearning (hiệu lực 30 phút):</p>"
                + "<p><a href=\"" + link + "\">Đặt lại mật khẩu</a></p>"
                + "<p>Nếu bạn không yêu cầu, hãy bỏ qua thư này. Mật khẩu hiện tại vẫn giữ nguyên.</p>";
        mailService.send(user.getEmail(), "Đặt lại mật khẩu VocabLearning", html);
    }
}
