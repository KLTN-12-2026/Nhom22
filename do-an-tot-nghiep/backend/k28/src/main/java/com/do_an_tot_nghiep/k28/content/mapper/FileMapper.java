package com.do_an_tot_nghiep.k28.content.mapper;

import com.do_an_tot_nghiep.k28.content.dto.FileResponse;
import com.do_an_tot_nghiep.k28.content.entity.TepTin;
import java.time.Instant;
import org.mapstruct.Mapper;

@Mapper
public interface FileMapper {

    FileResponse toResponse(TepTin file, String downloadUrl, Instant expiresAt);
}