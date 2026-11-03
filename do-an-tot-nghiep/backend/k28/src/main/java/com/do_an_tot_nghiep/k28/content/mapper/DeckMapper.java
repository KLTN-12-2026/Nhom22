package com.do_an_tot_nghiep.k28.content.mapper;

import com.do_an_tot_nghiep.k28.content.dto.DeckResponse;
import com.do_an_tot_nghiep.k28.content.entity.BoThe;
import org.mapstruct.Mapper;

@Mapper
public interface DeckMapper {

    DeckResponse toResponse(BoThe deck, boolean yeuThich);
}