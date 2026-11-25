package com.do_an_tot_nghiep.k28.support.service;

import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.realtime.LoaiSuKien;
import com.do_an_tot_nghiep.k28.common.realtime.RealtimeService;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.security.RateLimiter;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import com.do_an_tot_nghiep.k28.support.dto.CreateTicketRequest;
import com.do_an_tot_nghiep.k28.support.dto.TicketResponse;
import com.do_an_tot_nghiep.k28.support.entity.PhieuHoTro;
import com.do_an_tot_nghiep.k28.support.repository.PhieuHoTroRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SupportTicketService {

    private final PhieuHoTroRepository tickets;
    private final SupportTicketAssembler assembler;
    private final RateLimiter rateLimiter;
    private final RealtimeService realtime;

    @Transactional
    public TicketResponse create(Long userId, CreateTicketRequest request) {
        String tieuDe = request.tieuDe().strip();
        String moTa = request.moTa().strip();
        if (tieuDe.isEmpty()) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "tieuDe", "Vui lòng nhập tiêu đề");
        }
        if (moTa.isEmpty()) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "moTa", "Vui lòng nhập mô tả");
        }
        rateLimiter.check(RateLimiter.Policy.SUPPORT_TICKET, String.valueOf(userId));
        PhieuHoTro saved = tickets.saveAndFlush(PhieuHoTro.builder()
                .nguoiDungId(userId)
                .tieuDe(tieuDe)
                .moTa(moTa)
                .loaiVanDe(request.loaiVanDe())
                .doUuTien(request.doUuTien())
                .build());
        realtime.toAdmins(LoaiSuKien.HANG_CHO_QUAN_TRI);
        return assembler.assemble(List.of(saved), false).getFirst();
    }

    @Transactional(readOnly = true)
    public PageResponse<TicketResponse> list(Long userId, int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "page phải không âm, size từ 1 đến 100");
        }
        Page<PhieuHoTro> result = tickets.findByNguoiDungId(userId,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt", "id")));
        return PageResponse.of(new PageImpl<>(assembler.assemble(result.getContent(), false),
                result.getPageable(), result.getTotalElements()));
    }
}
