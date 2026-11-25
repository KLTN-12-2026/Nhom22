package com.do_an_tot_nghiep.k28.support.dto;

import com.do_an_tot_nghiep.k28.support.entity.enums.DoUuTien;
import com.do_an_tot_nghiep.k28.support.entity.enums.TrangThaiPhieu;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RespondTicketRequest(
        @Size(max = 2000, message = "Phản hồi tối đa 2000 ký tự")
        String noiDung,
        @NotNull(message = "Chọn trạng thái")
        TrangThaiPhieu trangThai,
        @NotNull(message = "Chọn độ ưu tiên")
        DoUuTien doUuTien,
        @NotNull(message = "Thiếu phiên bản phiếu")
        Long version
) {
}
