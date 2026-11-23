package com.do_an_tot_nghiep.k28.account.mapper;

import com.do_an_tot_nghiep.k28.account.dto.ThemeEventResponse;
import com.do_an_tot_nghiep.k28.account.dto.ThemeResponse;
import com.do_an_tot_nghiep.k28.account.entity.GiaoDien;
import com.do_an_tot_nghiep.k28.account.entity.LichLeGiaoDien;
import java.time.LocalDate;
import org.mapstruct.Mapper;

@Mapper
public interface ThemeMapper {

    ThemeResponse toResponse(GiaoDien giaoDien, boolean duocDung, String lyDoKhoa, ThemeEventResponse leHoi);

    default ThemeEventResponse toResponse(LichLeGiaoDien lich, LocalDate homNay) {
        if (lich == null) {
            return null;
        }
        return new ThemeEventResponse(
                lich.getId().toString(),
                lich.getGiaoDienMa(),
                lich.getNgayLe(),
                lich.getSoNgayTruoc(),
                lich.getSoNgaySau(),
                lich.moTu(),
                lich.denHet(),
                lich.dangMo(homNay)
        );
    }
}
