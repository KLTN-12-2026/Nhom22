package com.do_an_tot_nghiep.k28.notification.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record AnnouncementQuery(
        @Min(value = 0, message = "page phải không âm")
        Integer page,

        @Min(value = 1, message = "size tối thiểu là 1")
        @Max(value = 100, message = "size tối đa là 100")
        Integer size
) {

    public AnnouncementQuery {
        page = page == null ? 0 : page;
        size = size == null ? 20 : size;
    }
}
