package com.do_an_tot_nghiep.k28.moderation.mapper;

import com.do_an_tot_nghiep.k28.moderation.dto.ReportResponse;
import com.do_an_tot_nghiep.k28.moderation.entity.BaoCaoNoiDung;
import org.mapstruct.Mapper;

@Mapper
public interface ReportMapper {

    ReportResponse toResponse(BaoCaoNoiDung baoCao);
}
