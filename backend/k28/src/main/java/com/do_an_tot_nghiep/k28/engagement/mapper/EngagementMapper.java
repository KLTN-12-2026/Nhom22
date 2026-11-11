package com.do_an_tot_nghiep.k28.engagement.mapper;

import com.do_an_tot_nghiep.k28.engagement.dto.BadgeResponse;
import com.do_an_tot_nghiep.k28.engagement.dto.ChallengeResponse;
import com.do_an_tot_nghiep.k28.engagement.dto.RewardEventResponse;
import com.do_an_tot_nghiep.k28.engagement.entity.HuyHieu;
import com.do_an_tot_nghiep.k28.engagement.entity.SoDiemThuong;
import com.do_an_tot_nghiep.k28.engagement.entity.ThuThach;
import com.do_an_tot_nghiep.k28.engagement.entity.TienDoThuThach;
import java.time.Instant;
import java.time.LocalDate;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper
public interface EngagementMapper {

    RewardEventResponse toResponse(SoDiemThuong soDiemThuong);

    @Mapping(target = "daNhan", expression = "java(nhanAt != null)")
    BadgeResponse toResponse(HuyHieu huyHieu, Instant nhanAt);

    @Mapping(target = "id", source = "thuThach.id")
    @Mapping(target = "giaTri", source = "tienDo.giaTri")
    @Mapping(target = "hoanThanhAt", source = "tienDo.hoanThanhAt")
    @Mapping(target = "tuanBatDau", source = "tuanBatDau")
    ChallengeResponse toResponse(
            ThuThach thuThach,
            TienDoThuThach tienDo,
            LocalDate tuanBatDau,
            LocalDate tuanKetThuc
    );
}
