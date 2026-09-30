package com.do_an_tot_nghiep.k28.account.controller;

import com.do_an_tot_nghiep.k28.account.dto.ChangePasswordRequest;
import com.do_an_tot_nghiep.k28.account.dto.UserResponse;
import com.do_an_tot_nghiep.k28.account.service.AccountService;
import com.do_an_tot_nghiep.k28.account.service.PasswordService;
import com.do_an_tot_nghiep.k28.common.security.CurrentUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/me")
@RequiredArgsConstructor
public class MeController {

    private final AccountService accountService;
    private final CurrentUser currentUser;
    private final PasswordService passwordService;

    @GetMapping
    UserResponse me() {
        return accountService.me(currentUser.id());
    }

    @PutMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void changePassword(@Valid @RequestBody ChangePasswordRequest request, HttpServletRequest http) {
        HttpSession session = http.getSession(false);
        passwordService.changePassword(currentUser.id(), request, session == null ? null : session.getId());
    }
}