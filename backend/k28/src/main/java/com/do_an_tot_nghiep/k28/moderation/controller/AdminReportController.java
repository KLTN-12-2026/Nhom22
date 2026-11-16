package com.do_an_tot_nghiep.k28.moderation.controller;

import com.do_an_tot_nghiep.k28.common.security.CurrentUser;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import com.do_an_tot_nghiep.k28.moderation.dto.AdminReportResponse;
import com.do_an_tot_nghiep.k28.moderation.dto.ResolveReportRequest;
import com.do_an_tot_nghiep.k28.moderation.entity.enums.LoaiDoiTuongBaoCao;
import com.do_an_tot_nghiep.k28.moderation.entity.enums.TrangThaiBaoCao;
import com.do_an_tot_nghiep.k28.moderation.service.AdminReportService;
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
@RequestMapping("/api/v1/admin/reports")
public class AdminReportController {

    private final AdminReportService service;
    private final CurrentUser currentUser;

    @GetMapping
    public PageResponse<AdminReportResponse> list(
            @RequestParam(required = false) TrangThaiBaoCao trangThai,
            @RequestParam(required = false) LoaiDoiTuongBaoCao loaiDoiTuong,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return service.list(trangThai, loaiDoiTuong, page, size);
    }

    @PostMapping("/{id}/resolve")
    public AdminReportResponse resolve(@PathVariable Long id, @Valid @RequestBody ResolveReportRequest request) {
        return service.resolve(currentUser.id(), id, request);
    }
}
