package com.do_an_tot_nghiep.k28.support.controller;

import com.do_an_tot_nghiep.k28.common.security.CurrentUser;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import com.do_an_tot_nghiep.k28.support.dto.RespondTicketRequest;
import com.do_an_tot_nghiep.k28.support.dto.TicketResponse;
import com.do_an_tot_nghiep.k28.support.entity.enums.DoUuTien;
import com.do_an_tot_nghiep.k28.support.entity.enums.LoaiVanDe;
import com.do_an_tot_nghiep.k28.support.entity.enums.TrangThaiPhieu;
import com.do_an_tot_nghiep.k28.support.service.AdminSupportTicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@RequestMapping("/api/v1/admin/support-tickets")
public class AdminSupportTicketController {

    private final AdminSupportTicketService service;
    private final CurrentUser currentUser;

    @GetMapping
    public PageResponse<TicketResponse> list(
            @RequestParam(required = false) TrangThaiPhieu trangThai,
            @RequestParam(required = false) LoaiVanDe loaiVanDe,
            @RequestParam(required = false) DoUuTien doUuTien,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return service.list(trangThai, loaiVanDe, doUuTien, page, size);
    }

    @PostMapping("/{id}/respond")
    public TicketResponse respond(@PathVariable Long id, @Valid @RequestBody RespondTicketRequest request) {
        return service.respond(currentUser.id(), id, request);
    }
}
