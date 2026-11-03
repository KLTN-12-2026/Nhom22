package com.do_an_tot_nghiep.k28.account.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalTime;

public record NotificationSettingsResponse(
        boolean nhanTrongUngDung,
        boolean nhanEmail,
        boolean nhacHoc,
        @JsonFormat(pattern = "HH:mm")
        LocalTime gioNhac,
        Long version
) {
}
