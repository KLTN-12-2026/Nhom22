package com.do_an_tot_nghiep.k28.content.mapper;

import com.do_an_tot_nghiep.k28.content.dto.LibraryDeckResponse;
import com.do_an_tot_nghiep.k28.content.entity.BoThe;
import com.do_an_tot_nghiep.k28.content.entity.enums.NguonBo;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper
public interface LibraryDeckMapper {

    @Mapping(target = "nguon", source = "deck.boMau")
    LibraryDeckResponse toResponse(
            BoThe deck,
            String tenChuDe,
            String tenTacGia,
            long soThe
    );

    default NguonBo toSource(boolean boMau) {
        return boMau ? NguonBo.MAU : NguonBo.CHIA_SE;
    }
}
