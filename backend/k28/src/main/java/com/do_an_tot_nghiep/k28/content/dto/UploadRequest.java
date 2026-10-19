package com.do_an_tot_nghiep.k28.content.dto;

import com.do_an_tot_nghiep.k28.content.entity.enums.LoaiTep;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record UploadRequest(
        @NotNull(message = "Chọn loại tệp")
        LoaiTep loai,
        @NotBlank(message = "Thiếu loại nội dung của tệp")
        @Size(max = 50, message = "Loại nội dung tối đa 50 ký tự")
        String mimeType,
        @Positive(message = "Dung lượng tệp phải lớn hơn 0")
        long kichThuoc,
        @NotBlank(message = "Thiếu mã kiểm tra tệp")
        @Pattern(regexp = "[a-fA-F0-9]{64}", message = "Mã kiểm tra tệp phải gồm 64 ký tự thập lục phân")
        String checksum
) {
}
