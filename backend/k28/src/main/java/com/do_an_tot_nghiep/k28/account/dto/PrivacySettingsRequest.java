package com.do_an_tot_nghiep.k28.account.dto;

import jakarta.validation.constraints.NotNull;

public record PrivacySettingsRequest(
        @NotNull(message = "Chọn hiện hoặc ẩn hoạt động học trên hồ sơ công khai")
        Boolean congKhaiHoatDong,

        @NotNull(message = "Chọn tham gia hoặc không tham gia bảng xếp hạng")
        Boolean thamGiaXepHang,

        @NotNull(message = "Thiếu phiên bản, vui lòng tải lại")
        Long version
) {
}
