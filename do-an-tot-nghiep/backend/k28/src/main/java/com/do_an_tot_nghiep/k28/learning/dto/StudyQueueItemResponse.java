package com.do_an_tot_nghiep.k28.learning.dto;

import com.do_an_tot_nghiep.k28.content.dto.StudyCardResponse;
import com.do_an_tot_nghiep.k28.learning.entity.enums.TrangThaiPhienHocThe;

public record StudyQueueItemResponse(
        String theId,
        int thuTu,
        TrangThaiPhienHocThe trangThai,
        TienDoResponse tienDo,
        StudyCardResponse the
) {
}