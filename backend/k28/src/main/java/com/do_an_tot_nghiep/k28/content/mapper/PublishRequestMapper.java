package com.do_an_tot_nghiep.k28.content.mapper;

import com.do_an_tot_nghiep.k28.content.dto.DeckPublishStatusResponse;
import com.do_an_tot_nghiep.k28.content.dto.PublishRequestResponse;
import com.do_an_tot_nghiep.k28.content.entity.YeuCauCongKhai;
import java.time.Instant;
import org.mapstruct.Mapper;

@Mapper
public interface PublishRequestMapper {

    DeckPublishStatusResponse toStatus(YeuCauCongKhai request, Instant guiLaiSauAt);

    PublishRequestResponse toResponse(YeuCauCongKhai request, String tenBoThe, String tenBoNguon,
                                      String tenNguoiGui);
}
