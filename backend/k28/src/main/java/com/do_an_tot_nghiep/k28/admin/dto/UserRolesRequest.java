package com.do_an_tot_nghiep.k28.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record UserRolesRequest(
        @NotEmpty(message = "Vai trò phải gồm USER, có thể thêm ADMIN")
        @Size(max = 2, message = "Vai trò phải gồm USER, có thể thêm ADMIN")
        List<@NotNull(message = "Vai trò không được null") String> vaiTro,

        @NotBlank(message = "Nhập lý do từ 10 đến 500 ký tự")
        @Size(min = 10, max = 500, message = "Nhập lý do từ 10 đến 500 ký tự")
        String lyDo
) {

    public UserRolesRequest {
        lyDo = Reasons.normalize(lyDo);
    }
}
