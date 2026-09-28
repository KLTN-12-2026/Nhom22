package com.do_an_tot_nghiep.k28.account.service;

import com.do_an_tot_nghiep.k28.account.entity.LoaiToken;
import com.do_an_tot_nghiep.k28.account.entity.TokenTaiKhoan;
import com.do_an_tot_nghiep.k28.account.repository.TokenTaiKhoanRepository;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TokenService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final TokenTaiKhoanRepository tokens;
    private final Clock clock;

    @Transactional
    public String issue(Long userId, LoaiToken loai, Duration ttl) {
        Instant now = clock.instant();
        tokens.revokeActive(userId, loai, now);
        String raw = newRawToken();
        tokens.save(TokenTaiKhoan.issue(userId, sha256(raw), loai, now, ttl));
        return raw;
    }

    @Transactional
    public Long consume(String raw, LoaiToken loai) {
        TokenTaiKhoan token = tokens.findByTokenHashAndLoai(sha256(raw), loai)
                .orElseThrow(TokenService::invalid);
        if (tokens.markUsed(token.getId(), clock.instant()) == 0) {
            throw invalid();
        }
        return token.getNguoiDungId();
    }

    public static String sha256(String raw) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private static String newRawToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static ApiException invalid() {
        return new ApiException(ErrorCode.TOKEN_INVALID, "Liên kết xác thực không hợp lệ hoặc đã hết hạn");
    }
}