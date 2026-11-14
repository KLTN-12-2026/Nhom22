package com.do_an_tot_nghiep.k28.notification.mapper;

import com.do_an_tot_nghiep.k28.notification.dto.NotificationResponse;
import com.do_an_tot_nghiep.k28.notification.entity.ThongBao;
import org.mapstruct.Mapper;

@Mapper
public interface NotificationMapper {

    NotificationResponse toResponse(ThongBao thongBao);
}
