package com.do_an_tot_nghiep.k28.admin.dto;

import com.do_an_tot_nghiep.k28.common.quota.entity.enums.LoaiDichVu;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.util.List;

public record UpdateServiceQuotasRequest(
        @NotEmpty(message = "Chọn ít nhất một hạn mức")
        @Size(max = 20, message = "Tối đa 20 hạn mức mỗi lần")
        List<@Valid @NotNull(message = "Hạn mức không được null") HanMuc> hanMuc,

        @NotBlank(message = "Nhập lý do từ 10 đến 500 ký tự")
        @Size(min = 10, max = 500, message = "Nhập lý do từ 10 đến 500 ký tự")
        String lyDo
) {

    public UpdateServiceQuotasRequest {
        lyDo = Reasons.normalize(lyDo);
    }

    public record HanMuc(
            @NotBlank(message = "Chọn gói")
            @Size(max = 20, message = "Mã gói tối đa 20 ký tự")
            String goiMa,

            @NotNull(message = "Chọn loại dịch vụ")
            LoaiDichVu loai,

            @NotNull(message = "Nhập số lượt mỗi ngày")
            @Min(value = 0, message = "Số lượt từ 0 đến 10000")
            @Max(value = 10000, message = "Số lượt từ 0 đến 10000")
            Integer soLuotNgay,

            @NotNull(message = "Thiếu phiên bản, vui lòng tải lại")
            @PositiveOrZero(message = "Phiên bản không hợp lệ")
            Long version
    ) {
    }
}
