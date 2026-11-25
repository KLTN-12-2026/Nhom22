package com.do_an_tot_nghiep.k28.support.service;

import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.realtime.LoaiSuKien;
import com.do_an_tot_nghiep.k28.common.realtime.RealtimeService;
import com.do_an_tot_nghiep.k28.notification.entity.enums.LoaiThongBao;
import com.do_an_tot_nghiep.k28.notification.service.NotificationService;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import com.do_an_tot_nghiep.k28.support.dto.RespondTicketRequest;
import com.do_an_tot_nghiep.k28.support.dto.TicketResponse;
import com.do_an_tot_nghiep.k28.support.entity.PhanHoiPhieuHoTro;
import com.do_an_tot_nghiep.k28.support.entity.PhieuHoTro;
import com.do_an_tot_nghiep.k28.support.entity.enums.DoUuTien;
import com.do_an_tot_nghiep.k28.support.entity.enums.LoaiVanDe;
import com.do_an_tot_nghiep.k28.support.entity.enums.TrangThaiPhieu;
import com.do_an_tot_nghiep.k28.support.repository.PhanHoiPhieuHoTroRepository;
import com.do_an_tot_nghiep.k28.support.repository.PhieuHoTroRepository;
import java.util.ArrayList;
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
public class AdminSupportTicketService {

    private final PhieuHoTroRepository tickets;
    private final PhanHoiPhieuHoTroRepository replies;
    private final SupportTicketAssembler assembler;
    private final NotificationService notifications;
    private final RealtimeService realtime;

    @Transactional(readOnly = true)
    public PageResponse<TicketResponse> list(TrangThaiPhieu trangThai, LoaiVanDe loaiVanDe, DoUuTien doUuTien,
                                             int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "page phải không âm, size từ 1 đến 100");
        }
        Page<PhieuHoTro> result = tickets.search(trangThai, loaiVanDe, doUuTien,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt", "id")));
        return PageResponse.of(new PageImpl<>(assembler.assemble(result.getContent(), true),
                result.getPageable(), result.getTotalElements()));
    }

    @Transactional
    public TicketResponse respond(Long adminId, Long id, RespondTicketRequest request) {
        PhieuHoTro ticket = tickets.findForUpdate(id)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy phiếu hỗ trợ"));
        if (!ticket.getVersion().equals(request.version())) {
            throw new ApiException(ErrorCode.VERSION_CONFLICT,
                    "Phiếu đã thay đổi ở cửa sổ khác. Đóng chi tiết và mở lại để xem phiên bản mới.");
        }
        String noiDung = request.noiDung() == null ? "" : request.noiDung().strip();
        boolean statusChanged = request.trangThai() != ticket.getTrangThai();
        boolean priorityChanged = request.doUuTien() != ticket.getDoUuTien();
        if (noiDung.isEmpty() && !statusChanged && !priorityChanged) {
            throw new ApiException(ErrorCode.BUSINESS_RULE,
                    "Nhập phản hồi hoặc thay đổi trạng thái, độ ưu tiên trước khi lưu");
        }
        if (noiDung.isEmpty() && statusChanged && request.trangThai() == TrangThaiPhieu.DA_GIAI_QUYET) {
            throw new ApiException(ErrorCode.BUSINESS_RULE, "Nhập kết quả xử lý trước khi đánh dấu đã giải quyết");
        }
        List<String> actions = new ArrayList<>();
        if (statusChanged) {
            actions.add("Trạng thái: " + (request.trangThai() == TrangThaiPhieu.DA_GIAI_QUYET ? "Đã giải quyết" : "Đang mở"));
        }
        if (priorityChanged) {
            actions.add("Ưu tiên: " + priorityLabel(request.doUuTien()));
        }
        ticket.handle(request.trangThai(), request.doUuTien());
        replies.save(PhanHoiPhieuHoTro.of(ticket.getId(), adminId, noiDung,
                actions.isEmpty() ? "Đã phản hồi học viên" : String.join(" · ", actions)));
        tickets.saveAndFlush(ticket);
        String hanhDong = actions.isEmpty() ? "Đã phản hồi học viên" : String.join(" · ", actions);
        notifications.create(ticket.getNguoiDungId(), LoaiThongBao.PHAN_HOI_HO_TRO, null,
                "Phiếu hỗ trợ #HT-" + ticket.getId() + " có cập nhật",
                noiDung.isEmpty() ? hanhDong : noiDung, "/phieu-ho-tro", true, false);
        realtime.toOtherAdmins(adminId, LoaiSuKien.MUC_DA_XU_LY, "HO_TRO:" + ticket.getId());
        return assembler.assemble(List.of(ticket), true).getFirst();
    }

    private static String priorityLabel(DoUuTien doUuTien) {
        return switch (doUuTien) {
            case THAP -> "Thấp";
            case TRUNG_BINH -> "Trung bình";
            case CAO -> "Cao";
            case NGHIEM_TRONG -> "Nghiêm trọng";
        };
    }
}
