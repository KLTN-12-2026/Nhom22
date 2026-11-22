package com.do_an_tot_nghiep.k28.notification.mapper;

import com.do_an_tot_nghiep.k28.notification.dto.AnnouncementResponse;
import com.do_an_tot_nghiep.k28.notification.dto.SystemAnnouncementResponse;
import com.do_an_tot_nghiep.k28.notification.entity.ThongBaoHeThong;
import org.mapstruct.Mapper;

@Mapper
public interface AnnouncementMapper {

    SystemAnnouncementResponse toAdminResponse(ThongBaoHeThong thongBao);

    AnnouncementResponse toResponse(ThongBaoHeThong thongBao);
}
