package com.do_an_tot_nghiep.k28.account.controller;

import com.do_an_tot_nghiep.k28.account.dto.GoogleProfile;
import com.do_an_tot_nghiep.k28.account.service.GoogleLoginService;
import com.do_an_tot_nghiep.k28.account.service.LoginService;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.security.SessionAuthenticator;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.time.Clock;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.client.web.HttpSessionOAuth2AuthorizedClientRepository;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizedClientRepository;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class GoogleLoginSuccessHandler implements AuthenticationSuccessHandler {

    public static final String NEXT = "googleLoginNext";

    private final GoogleLoginService googleLoginService;
    private final SessionAuthenticator sessionAuthenticator;
    private final Clock clock;
    private final OAuth2AuthorizedClientRepository authorizedClients = new HttpSessionOAuth2AuthorizedClientRepository();

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2AuthenticationToken token = (OAuth2AuthenticationToken) authentication;
        authorizedClients.removeAuthorizedClient(token.getAuthorizedClientRegistrationId(), token, request, response);
        OidcUser google = (OidcUser) token.getPrincipal();
        GoogleProfile profile = new GoogleProfile(google.getSubject(), google.getEmail(),
                Boolean.TRUE.equals(google.getEmailVerified()), google.getFullName(), clock.instant());
        HttpSession session = request.getSession();
        Object next = session.getAttribute(NEXT);
        session.removeAttribute(NEXT);
        try {
            LoginService.LoginResult result = googleLoginService.login(profile);
            sessionAuthenticator.login(result.principal(), request, response);
            String target = !result.user().daHoanTatKhoiDau() ? "/bat-dau" : next instanceof String path ? path : "/bo-the";
            response.sendRedirect(frontendUrl + target);
        } catch (ApiException ex) {
            SecurityContextHolder.clearContext();
            session.removeAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY);
            if (ex.getErrorCode() == ErrorCode.OAUTH_LINK_REQUIRED) {
                session.setAttribute(GoogleLoginService.PENDING_LINK, profile);
            }
            response.sendRedirect(frontendUrl + "/dang-nhap?loi=" + ex.getErrorCode().name());
        }
    }
}