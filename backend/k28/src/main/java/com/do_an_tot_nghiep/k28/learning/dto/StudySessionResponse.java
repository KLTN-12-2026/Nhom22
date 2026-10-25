package com.do_an_tot_nghiep.k28.learning.dto;

import com.do_an_tot_nghiep.k28.learning.entity.enums.ChieuHoc;
import com.do_an_tot_nghiep.k28.learning.entity.enums.TrangThaiPhienHoc;
import java.time.Instant;
import java.util.List;

public record StudySessionResponse(
        String id,
        String boTheId,
        String boTheTen,
        ChieuHoc chieuHoc,
        int quyThoiGian,
        Instant batDauAt,
        Instant hetGioAt,
        Instant ketThucAt,
        TrangThaiPhienHoc trangThai,
        String muiGio,
        List<StudyQueueItemResponse> hangDoi
) {
}