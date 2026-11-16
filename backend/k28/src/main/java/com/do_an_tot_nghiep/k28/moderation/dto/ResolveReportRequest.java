package com.do_an_tot_nghiep.k28.moderation.dto;

import com.do_an_tot_nghiep.k28.moderation.entity.enums.QuyetDinhBaoCao;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ResolveReportRequest(
        @NotNull(message = "Chọn quyết định GIU hoặc AN")
        QuyetDinhBaoCao quyetDinh,
        @NotBlank(message = "Nhập lý do từ 10 đến 500 ký tự")
        @Size(min = 10, max = 500, message = "Nhập lý do từ 10 đến 500 ký tự")
        String lyDo
) {
}
