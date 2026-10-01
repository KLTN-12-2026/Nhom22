package com.do_an_tot_nghiep.k28.account.service;

import com.do_an_tot_nghiep.k28.account.dto.GoogleProfile;
import com.do_an_tot_nghiep.k28.account.entity.CaiDatThongBao;
import com.do_an_tot_nghiep.k28.account.entity.DanhTinhOauth;
import com.do_an_tot_nghiep.k28.account.entity.HoSoHocTap;
import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.entity.NhaCungCap;
import com.do_an_tot_nghiep.k28.account.entity.TrangThaiNguoiDung;
import com.do_an_tot_nghiep.k28.account.entity.VaiTro;
import com.do_an_tot_nghiep.k28.account.repository.CaiDatThongBaoRepository;
import com.do_an_tot_nghiep.k28.account.repository.DanhTinhOauthRepository;
import com.do_an_tot_nghiep.k28.account.repository.HoSoHocTapRepository;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GoogleLoginService {

    public static final String PENDING_LINK = "pendingGoogleLink";
    static final Duration LINK_TTL = Duration.ofMinutes(10);
    private static final String DEFAULT_TIME_ZONE = "Asia/Ho_Chi_Minh";

    private final DanhTinhOauthRepository identities;
    private final NguoiDungRepository users;
    private final VaiTroRepository roles;
    private final HoSoHocTapRepository profiles;
    private final CaiDatThongBaoRepository notificationSettings;
    private final AccountService accountService;
    private final Clock clock;

    @Transactional
    public LoginService.LoginResult login(GoogleProfile google) {
        if (!google.emailVerified() || google.email() == null) {
            throw new ApiException(ErrorCode.EMAIL_NOT_VERIFIED, "Email Google chưa được xác minh");
        }
        NguoiDung user = identities.findByNhaCungCapAndSubject(NhaCungCap.GOOGLE, google.subject())
                .flatMap(identity -> users.findById(identity.getNguoiDungId()))
                .orElseGet(() -> register(google));
        if (user.getTrangThai() != TrangThaiNguoiDung.HOAT_DONG) {
            throw new ApiException(ErrorCode.ACCOUNT_LOCKED, "Tài khoản đã bị khóa. Liên hệ với quản trị viên để được hỗ trợ");
        }
        user.recordLogin(clock.instant());
        return new LoginService.LoginResult(LoginService.principalOf(user), accountService.toResponse(user));
    }

    @Transactional
    public boolean link(Long userId, GoogleProfile google) {
        Instant now = clock.instant();
        if (google.createdAt().plus(LINK_TTL).isBefore(now)
                || identities.findByNhaCungCapAndSubject(NhaCungCap.GOOGLE, google.subject()).isPresent()
                || identities.existsByNguoiDungIdAndNhaCungCap(userId, NhaCungCap.GOOGLE)) {
            return false;
        }
        NguoiDung user = users.findById(userId).orElse(null);
        if (user == null || !user.getEmail().equals(Emails.normalize(google.email()))) {
            return false;
        }
        try {
            identities.saveAndFlush(DanhTinhOauth.google(userId, google.subject(), user.getEmail(), now));
            return true;
        } catch (DataIntegrityViolationException e) {
            return false;
        }
    }

    private NguoiDung register(GoogleProfile google) {
        String email = Emails.normalize(google.email());
        if (users.existsByEmail(email)) {
            throw linkRequired();
        }
        Instant now = clock.instant();
        VaiTro userRole = roles.findByMa(VaiTro.USER)
                .orElseThrow(() -> new IllegalStateException("Missing role USER"));
        NguoiDung user = NguoiDung.registerOAuth(email, google.name(), DEFAULT_TIME_ZONE, userRole, now);
        try {
            users.saveAndFlush(user);
            identities.saveAndFlush(DanhTinhOauth.google(user.getId(), google.subject(), email, now));
        } catch (DataIntegrityViolationException e) {
            throw linkRequired();
        }
        profiles.save(HoSoHocTap.defaultFor(user.getId()));
        notificationSettings.save(CaiDatThongBao.defaultFor(user.getId()));
        return user;
    }

    private static ApiException linkRequired() {
        return new ApiException(ErrorCode.OAUTH_LINK_REQUIRED,
                "Email này đã có tài khoản. Đăng nhập bằng mật khẩu để liên kết Google");
    }
}