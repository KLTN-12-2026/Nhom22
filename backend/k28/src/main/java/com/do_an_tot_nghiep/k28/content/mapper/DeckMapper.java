package com.do_an_tot_nghiep.k28.content.mapper;

import com.do_an_tot_nghiep.k28.content.dto.BanSaoResponse;
import com.do_an_tot_nghiep.k28.content.dto.DeckPublishStatusResponse;
import com.do_an_tot_nghiep.k28.content.dto.DeckResponse;
import com.do_an_tot_nghiep.k28.content.entity.BoThe;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper
public interface DeckMapper {

    @Mapping(target = "id", source = "deck.id")
    @Mapping(target = "createdAt", source = "deck.createdAt")
    @Mapping(target = "version", source = "deck.version")
    DeckResponse toResponse(BoThe deck, boolean yeuThich, int soThe, BanSaoResponse banSao,
                            DeckPublishStatusResponse yeuCauCongKhai);

    default DeckResponse toResponse(BoThe deck, boolean yeuThich, int soThe) {
        return toResponse(deck, yeuThich, soThe, null, null);
    }
}
