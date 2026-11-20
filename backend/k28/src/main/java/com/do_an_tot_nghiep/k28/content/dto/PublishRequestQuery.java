package com.do_an_tot_nghiep.k28.content.dto;

import com.do_an_tot_nghiep.k28.content.entity.enums.TrangThaiYeuCauCongKhai;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record PublishRequestQuery(
        TrangThaiYeuCauCongKhai trangThai,

        @Min(value = 0, message = "page phải không âm")
        Integer page,

        @Min(value = 1, message = "size từ 1 đến 100")
        @Max(value = 100, message = "size từ 1 đến 100")
        Integer size
) {
    public PublishRequestQuery {
        page = page == null ? 0 : page;
        size = size == null ? 20 : size;
    }
}
