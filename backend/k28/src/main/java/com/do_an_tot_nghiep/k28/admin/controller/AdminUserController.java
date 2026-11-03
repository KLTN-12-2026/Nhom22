package com.do_an_tot_nghiep.k28.admin.controller;

import com.do_an_tot_nghiep.k28.account.entity.enums.TrangThaiNguoiDung;
import com.do_an_tot_nghiep.k28.admin.dto.AdminUserResponse;
import com.do_an_tot_nghiep.k28.admin.dto.UserRolesRequest;
import com.do_an_tot_nghiep.k28.admin.dto.UserStatusRequest;
import com.do_an_tot_nghiep.k28.admin.service.AdminUserService;
import com.do_an_tot_nghiep.k28.common.security.CurrentUser;
import com.do_an_tot_nghiep.k28.common.security.SessionAuthenticator;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@RequestMapping("/api/v1/admin/users")
public class AdminUserController {

    private final AdminUserService service;
    private final CurrentUser currentUser;
    private final SessionAuthenticator sessionAuthenticator;

    @GetMapping
    public PageResponse<AdminUserResponse> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) TrangThaiNguoiDung trangThai,
            @RequestParam(required = false) String vaiTro,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return service.list(q == null || q.isBlank() ? null : q.strip(), trangThai,
                vaiTro == null || vaiTro.isBlank() ? null : vaiTro.strip(), page, size);
    }

    @PatchMapping("/{id}/status")
    public AdminUserResponse changeStatus(@PathVariable Long id, @Valid @RequestBody UserStatusRequest request) {
        return service.changeStatus(currentUser.id(), id, request);
    }

    @PutMapping("/{id}/roles")
    public AdminUserResponse changeRoles(
            @PathVariable Long id,
            @Valid @RequestBody UserRolesRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        HttpSession session = httpRequest.getSession(false);
        AdminUserService.RolesResult result = service.changeRoles(
                currentUser.id(), id, request, session == null ? null : session.getId());
        if (result.banThanMatQuyen()) {
            sessionAuthenticator.logout(httpRequest, httpResponse);
        }
        return result.user();
    }
}
