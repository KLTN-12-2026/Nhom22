package com.do_an_tot_nghiep.k28.speaking.mapper;

import com.do_an_tot_nghiep.k28.content.dto.FileResponse;
import com.do_an_tot_nghiep.k28.speaking.dto.CardAudioResponse;
import org.mapstruct.Mapper;

@Mapper
public interface CardAudioMapper {

    CardAudioResponse toResponse(FileResponse file, String nguon, boolean moPhong);
}
