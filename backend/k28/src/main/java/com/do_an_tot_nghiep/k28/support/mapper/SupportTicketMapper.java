package com.do_an_tot_nghiep.k28.support.mapper;

import com.do_an_tot_nghiep.k28.support.dto.TicketResponse;
import com.do_an_tot_nghiep.k28.support.entity.PhanHoiPhieuHoTro;
import com.do_an_tot_nghiep.k28.support.entity.PhieuHoTro;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper
public interface SupportTicketMapper {

    @Mapping(target = "nguoiDung", ignore = true)
    @Mapping(target = "phanHoi", ignore = true)
    TicketResponse toResponse(PhieuHoTro phieu);

    @Mapping(target = "id", source = "phanHoi.id")
    @Mapping(target = "createdAt", source = "phanHoi.createdAt")
    TicketResponse.PhanHoi toPhanHoi(PhanHoiPhieuHoTro phanHoi, String nguoiXuLy);
}
