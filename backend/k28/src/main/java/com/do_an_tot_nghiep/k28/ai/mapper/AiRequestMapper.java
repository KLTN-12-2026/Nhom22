package com.do_an_tot_nghiep.k28.ai.mapper;

import com.do_an_tot_nghiep.k28.ai.dto.AiRequestResponse;
import com.do_an_tot_nghiep.k28.ai.dto.CardDraftData;
import com.do_an_tot_nghiep.k28.ai.dto.CardDraftResponse;
import com.do_an_tot_nghiep.k28.ai.entity.BanNhapTheAi;
import com.do_an_tot_nghiep.k28.ai.entity.YeuCauAi;
import java.util.List;
import org.mapstruct.Mapper;

@Mapper
public interface AiRequestMapper {

    AiRequestResponse toResponse(YeuCauAi yeuCau, List<CardDraftResponse> banNhap);

    CardDraftResponse toResponse(BanNhapTheAi banNhap, CardDraftData noiDung);
}
