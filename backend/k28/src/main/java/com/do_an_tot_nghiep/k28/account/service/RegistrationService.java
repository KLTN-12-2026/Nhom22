package com.do_an_tot_nghiep.k28.account.service;

import com.do_an_tot_nghiep.k28.account.dto.RegisterRequest;
import com.do_an_tot_nghiep.k28.account.dto.UserResponse;
import com.do_an_tot_nghiep.k28.account.entity.CaiDatThongBao;
import com.do_an_tot_nghiep.k28.account.entity.HoSoHocTap;
import com.do_an_tot_nghiep.k28.account.entity.enums.LoaiToken;
import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.entity.VaiTro;
import com.do_an_tot_nghiep.k28.account.mapper.UserMapper;
import com.do_an_tot_nghiep.k28.account.repository.CaiDatThongBaoRepository;
import com.do_an_tot_nghiep.k28.account.repository.HoSoHocTapRepository;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.mail.MailService;
import com.do_an_tot_nghiep.k28.common.security.RateLimiter;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.DateTimeException;
import java.time.Duration;
import java.time.ZoneId;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.HtmlUtils;

@Service
@RequiredArgsConstructor
public class RegistrationService {

    static final Duration VERIFY_TTL = Duration.ofHours(24);
    private static final String DEFAULT_TIME_ZONE = "Asia/Ho_Chi_Minh";

    private final NguoiDungRepository users;
    private final VaiTroRepository roles;
    private final HoSoHocTapRepository profiles;
    private final CaiDatThongBaoRepository notificationSettings;
    private final TokenService tokenService;
    private final MailService mailService;
    private final RateLimiter rateLimiter;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
    private final Clock clock;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Transactional
    public UserResponse register(RegisterRequest request, String clientIp) {
        rateLimiter.check(RateLimiter.Policy.REGISTER, clientIp);
        String email = Emails.normalize(request.email());
        if (users.existsByEmail(email)) {
            throw emailTaken();
        }
        VaiTro userRole = roles.findByMa(VaiTro.USER)
                .orElseThrow(() -> new IllegalStateException("Missing role USER"));
        NguoiDung user = NguoiDung.register(email, request.tenHienThi().trim(),
                passwordEncoder.encode(request.password()), timeZone(request.muiGio()), userRole);
        try {
            users.saveAndFlush(user);
        } catch (DataIntegrityViolationException e) {
            throw emailTaken();
        }
        HoSoHocTap hoSo = profiles.save(HoSoHocTap.defaultFor(user.getId()));
        notificationSettings.save(CaiDatThongBao.defaultFor(user.getId()));
        sendVerification(user);
        return userMapper.toResponse(user, hoSo);
    }

    @Transactional
    public void verifyEmail(String rawToken) {
        Long userId = tokenService.consume(rawToken, LoaiToken.XAC_THUC_EMAIL);
        users.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.TOKEN_INVALID, "Liên kết xác thực không hợp lệ hoặc đã hết hạn"))
                .verifyEmail(clock.instant());
    }

    @Transactional
    public void resendVerification(String rawEmail, String clientIp) {
        String email = Emails.normalize(rawEmail);
        rateLimiter.check(RateLimiter.Policy.RESEND_EMAIL, "ip:" + clientIp);
        rateLimiter.check(RateLimiter.Policy.RESEND_EMAIL, "email:" + TokenService.sha256(email));
        users.findByEmail(email)
                .filter(NguoiDung::isUnverified)
                .ifPresent(this::sendVerification);
    }

    private void sendVerification(NguoiDung user) {
        String token = tokenService.issue(user.getId(), LoaiToken.XAC_THUC_EMAIL, VERIFY_TTL);
        String link = frontendUrl + "/xac-thuc-email?token=" + URLEncoder.encode(token, StandardCharsets.UTF_8);
        String html = "<p>Xin chào " + HtmlUtils.htmlEscape(user.getTenHienThi()) + ",</p>"
                + "<p>Nhấn vào liên kết sau để xác thực email tài khoản VocabLearning (hiệu lực 24 giờ):</p>"
                + "<p><a href=\"" + link + "\">Xác thực email</a></p>"
                + "<p>Nếu bạn không đăng ký, hãy bỏ qua thư này.</p>";
        mailService.send(user.getEmail(), "Xác thực email VocabLearning", html);
    }

    private static String timeZone(String muiGio) {
        if (muiGio == null || muiGio.isBlank()) {
            return DEFAULT_TIME_ZONE;
        }
        try {
            return ZoneId.of(muiGio.strip()).getId();
        } catch (DateTimeException e) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "Múi giờ không hợp lệ");
        }
    }

    private static ApiException emailTaken() {
        return new ApiException(ErrorCode.CONFLICT, "Email đã được sử dụng");
    }
}
