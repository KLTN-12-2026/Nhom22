package com.do_an_tot_nghiep.k28.content.mapper;

import com.do_an_tot_nghiep.k28.content.dto.SampleDeckResponse;
import com.do_an_tot_nghiep.k28.content.entity.BoThe;
import org.mapstruct.Mapper;

@Mapper
public interface SampleDeckMapper {

    SampleDeckResponse toResponse(BoThe deck, String chuDeTen, int soThe, int soBanSao);
}
