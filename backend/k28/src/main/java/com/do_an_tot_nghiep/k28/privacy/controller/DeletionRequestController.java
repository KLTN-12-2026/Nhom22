package com.do_an_tot_nghiep.k28.privacy.controller;

import com.do_an_tot_nghiep.k28.common.security.CurrentUser;
import com.do_an_tot_nghiep.k28.common.security.SessionAuthenticator;
import com.do_an_tot_nghiep.k28.privacy.dto.DeletionRequest;
import com.do_an_tot_nghiep.k28.privacy.dto.DeletionRequestResponse;
import com.do_an_tot_nghiep.k28.privacy.service.AccountDeletionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class DeletionRequestController {

    private final AccountDeletionService deletion;
    private final CurrentUser currentUser;
    private final SessionAuthenticator sessionAuthenticator;

    @PostMapping("/api/v1/me/deletion-requests")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public DeletionRequestResponse request(@Valid @RequestBody DeletionRequest request,
                                           HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        HttpSession session = httpRequest.getSession(false);
        DeletionRequestResponse response = deletion.request(currentUser.id(),
                session == null ? null : session.getId(), request);
        sessionAuthenticator.logout(httpRequest, httpResponse);
        return response;
    }
}
