package com.do_an_tot_nghiep.k28.admin.dto;

import com.do_an_tot_nghiep.k28.common.quota.entity.enums.LoaiDichVu;
import java.time.LocalDate;
import java.util.List;

public record ServiceUsageResponse(
        String muiGio,
        LocalDate tuNgay,
        LocalDate denNgay,
        List<DichVu> dichVu
) {

    public record DichVu(
            LoaiDichVu loai,
            long soLuotDung,
            long soDangGiu,
            long soNguoiDung,
            Long soLoi,
            Long soKhongXacDinh
    ) {
    }
}
