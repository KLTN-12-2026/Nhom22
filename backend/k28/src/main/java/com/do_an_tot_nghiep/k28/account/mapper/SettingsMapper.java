package com.do_an_tot_nghiep.k28.account.mapper;

import com.do_an_tot_nghiep.k28.account.dto.LearningSettingsResponse;
import com.do_an_tot_nghiep.k28.account.dto.NotificationSettingsResponse;
import com.do_an_tot_nghiep.k28.account.entity.CaiDatThongBao;
import com.do_an_tot_nghiep.k28.account.entity.HoSoHocTap;
import org.mapstruct.Mapper;

@Mapper
public interface SettingsMapper {

    LearningSettingsResponse toResponse(HoSoHocTap hoSo);

    NotificationSettingsResponse toResponse(CaiDatThongBao caiDat);
}
