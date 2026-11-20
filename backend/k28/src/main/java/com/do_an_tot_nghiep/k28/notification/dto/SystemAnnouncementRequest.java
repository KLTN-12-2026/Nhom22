package com.do_an_tot_nghiep.k28.notification.dto;

import com.do_an_tot_nghiep.k28.notification.entity.enums.MucDoThongBao;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public record SystemAnnouncementRequest(
        @NotBlank @Size(max = 200) String tieuDe,
        @NotBlank @Size(max = 2000) String noiDung,
        @NotNull MucDoThongBao mucDo,
        @Size(max = 300) @Pattern(regexp = "^/(?!/).*", message = "Liên kết phải là đường dẫn nội bộ bắt đầu bằng /")
        String lienKet,
        @NotNull Instant batDauAt,
        Instant ketThucAt,
        boolean hienThi,
        Long version
) {
}
