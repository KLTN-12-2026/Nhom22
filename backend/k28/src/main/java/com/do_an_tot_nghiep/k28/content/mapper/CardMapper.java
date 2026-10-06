package com.do_an_tot_nghiep.k28.content.mapper;

import com.do_an_tot_nghiep.k28.content.dto.CardResponse;
import com.do_an_tot_nghiep.k28.content.entity.TheTuVung;

import java.util.List;

import org.mapstruct.Mapper;

@Mapper
public interface CardMapper {

    CardResponse toResponse(
            TheTuVung card,
            List<String> nhanIds,
            String anhId,
            String amTuId,
            String amCauId,
            boolean trung,
            List<String> theTrungIds
    );
}