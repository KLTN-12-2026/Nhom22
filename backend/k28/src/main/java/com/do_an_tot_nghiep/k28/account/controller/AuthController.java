package com.do_an_tot_nghiep.k28.account.controller;

import com.do_an_tot_nghiep.k28.account.dto.*;
import com.do_an_tot_nghiep.k28.account.service.GoogleLoginService;
import com.do_an_tot_nghiep.k28.account.service.LoginService;
import com.do_an_tot_nghiep.k28.account.service.PasswordService;
import com.do_an_tot_nghiep.k28.account.service.RegistrationService;
import com.do_an_tot_nghiep.k28.common.security.SessionAuthenticator;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final RegistrationService registrationService;
    private final LoginService loginService;
    private final SessionAuthenticator sessionAuthenticator;
    private final PasswordService passwordService;
    private final GoogleLoginService googleLoginService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    UserResponse register(@Valid @RequestBody RegisterRequest request, HttpServletRequest http) {
        return registrationService.register(request, http.getRemoteAddr());
    }

    @PostMapping("/verify-email")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        registrationService.verifyEmail(request.token());
    }

    @PostMapping("/resend-verification")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void resendVerification(@Valid @RequestBody ResendVerificationRequest request, HttpServletRequest http) {
        registrationService.resendVerification(request.email(), http.getRemoteAddr());
    }

    @PostMapping("/login")
    UserResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest http, HttpServletResponse response) {
        LoginService.LoginResult result = loginService.login(request);
        linkPendingGoogle(http, result.principal().id());
        sessionAuthenticator.login(result.principal(), http, response);
        return result.user();
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void logout(HttpServletRequest http, HttpServletResponse response) {
        sessionAuthenticator.logout(http, response);
    }

    @PostMapping("/forgot-password")
    void forgotPassword(@Valid @RequestBody ForgotPasswordRequest request, HttpServletRequest http) {
        passwordService.forgotPassword(request.email(), http.getRemoteAddr());
    }

    @PostMapping("/reset-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordService.resetPassword(request.token(), request.password());
    }

    @GetMapping("/google/start")
    void googleStart(@RequestParam(required = false) String next, HttpServletRequest http,
                     HttpServletResponse response) throws IOException {
        HttpSession session = http.getSession();
        if (isSafeNext(next)) {
            session.setAttribute(GoogleLoginSuccessHandler.NEXT, next);
        } else {
            session.removeAttribute(GoogleLoginSuccessHandler.NEXT);
        }
        response.sendRedirect("/api/v1/auth/oauth2/google");
    }

    private void linkPendingGoogle(HttpServletRequest http, Long userId) {
        HttpSession session = http.getSession(false);
        if (session != null && session.getAttribute(GoogleLoginService.PENDING_LINK) instanceof GoogleProfile pending) {
            session.removeAttribute(GoogleLoginService.PENDING_LINK);
            googleLoginService.link(userId, pending);
        }
    }

    private static boolean isSafeNext(String next) {
        return next != null && next.length() <= 200 && next.startsWith("/")
                && !next.startsWith("//") && !next.contains("\\");
    }
}
