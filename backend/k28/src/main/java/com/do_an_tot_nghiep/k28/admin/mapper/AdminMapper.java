package com.do_an_tot_nghiep.k28.admin.mapper;

import com.do_an_tot_nghiep.k28.account.dto.UserAdminView;
import com.do_an_tot_nghiep.k28.admin.dto.AdminUserResponse;
import org.mapstruct.Mapper;

@Mapper
public interface AdminMapper {

    AdminUserResponse toResponse(UserAdminView nguoiDung, int soBoThe, Integer soPhienDaHuy, Boolean banThanMatQuyen);
}
