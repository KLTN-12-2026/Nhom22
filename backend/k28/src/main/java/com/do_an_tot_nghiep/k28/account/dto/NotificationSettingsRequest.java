package com.do_an_tot_nghiep.k28.account.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;
import java.time.LocalTime;

public record NotificationSettingsRequest(
        @NotNull(message = "Chọn nhận thông báo trong ứng dụng")
        Boolean nhanTrongUngDung,

        @NotNull(message = "Chọn nhận thông báo qua email")
        Boolean nhanEmail,

        @NotNull(message = "Chọn bật hoặc tắt nhắc học")
        Boolean nhacHoc,

        @JsonFormat(pattern = "HH:mm")
        LocalTime gioNhac,

        @NotNull(message = "Thiếu phiên bản, vui lòng tải lại")
        Long version
) {
}
