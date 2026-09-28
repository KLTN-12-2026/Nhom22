package com.do_an_tot_nghiep.k28.account.mapper;

import com.do_an_tot_nghiep.k28.account.dto.UserResponse;
import com.do_an_tot_nghiep.k28.account.entity.HoSoHocTap;
import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.entity.VaiTro;
import org.mapstruct.Mapper;

@Mapper
public interface UserMapper {

    UserResponse toResponse(NguoiDung nguoiDung, HoSoHocTap hoSo);

    default String ma(VaiTro vaiTro) {
        return vaiTro.getMa();
    }
}
