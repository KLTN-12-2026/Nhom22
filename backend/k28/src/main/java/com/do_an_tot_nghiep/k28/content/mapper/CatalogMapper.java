package com.do_an_tot_nghiep.k28.content.mapper;

import com.do_an_tot_nghiep.k28.content.dto.TagResponse;
import com.do_an_tot_nghiep.k28.content.dto.TopicResponse;
import com.do_an_tot_nghiep.k28.content.entity.ChuDe;
import com.do_an_tot_nghiep.k28.content.entity.Nhan;
import org.mapstruct.Mapper;

@Mapper
public interface CatalogMapper {
    TopicResponse toResponse(ChuDe topic);
    TagResponse toResponse(Nhan tag);
}