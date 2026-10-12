package com.do_an_tot_nghiep.k28.content.mapper;

import com.do_an_tot_nghiep.k28.content.dto.CreateCardRequest;
import com.do_an_tot_nghiep.k28.content.dto.CsvCardData;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper
public interface CsvMapper {

    @Mapping(target = "doKho", source = "parsedDoKho")
    CsvCardData toData(
            CreateCardRequest request,
            Integer parsedDoKho
    );

    @Mapping(target = "anhId", ignore = true)
    @Mapping(target = "amTuId", ignore = true)
    @Mapping(target = "amCauId", ignore = true)
    CreateCardRequest toRequest(CsvCardData data);
}