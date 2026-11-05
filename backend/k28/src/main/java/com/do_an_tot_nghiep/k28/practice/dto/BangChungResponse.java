package com.do_an_tot_nghiep.k28.practice.dto;

import com.do_an_tot_nghiep.k28.practice.entity.enums.LoaiCau;
import com.do_an_tot_nghiep.k28.practice.entity.enums.NguonSuKien;
import com.do_an_tot_nghiep.k28.practice.entity.enums.NhomLoi;
import java.time.Instant;

public record BangChungResponse(
        NhomLoi nhomLoi,
        NguonSuKien nguonSuKien,
        String suKienId,
        String baiLuyenId,
        String cauHoiId,
        LoaiCau loaiCau,
        String traLoi,
        String dapAn,
        Instant createdAt
) {
}
