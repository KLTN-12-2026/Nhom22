package com.do_an_tot_nghiep.k28.practice.dto;

import com.do_an_tot_nghiep.k28.practice.entity.enums.MaLyDo;
import java.time.Instant;
import java.util.List;

public record NotebookItemResponse(
        String theId,
        String tu,
        String tuLoai,
        String phienAm,
        String nghiaVi,
        String boTheId,
        String boTheTen,
        List<NhomLoiCountResponse> nhomLoi,
        List<MaLyDo> lyDo,
        List<BangChungResponse> bangChung,
        int soLanQuen,
        String ghiChu,
        boolean danhDauThuCong,
        Instant lanGanNhatAt
) {
}
