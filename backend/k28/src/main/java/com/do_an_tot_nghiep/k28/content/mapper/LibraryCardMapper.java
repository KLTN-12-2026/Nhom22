package com.do_an_tot_nghiep.k28.content.mapper;

import com.do_an_tot_nghiep.k28.content.dto.LibraryCardResponse;
import com.do_an_tot_nghiep.k28.content.entity.TheTuVung;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper
public interface LibraryCardMapper {

    LibraryCardResponse toResponse(
            TheTuVung card,
            List<String> nhanIds,
            String anhId,
            String amTuId,
            String amCauId
    );
}