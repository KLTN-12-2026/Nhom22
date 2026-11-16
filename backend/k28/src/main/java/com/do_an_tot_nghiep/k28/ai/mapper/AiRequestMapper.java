package com.do_an_tot_nghiep.k28.ai.mapper;

import com.do_an_tot_nghiep.k28.ai.dto.AiRequestResponse;
import com.do_an_tot_nghiep.k28.ai.dto.CardDraftData;
import com.do_an_tot_nghiep.k28.ai.dto.CardDraftResponse;
import com.do_an_tot_nghiep.k28.ai.entity.BanNhapTheAi;
import com.do_an_tot_nghiep.k28.ai.entity.YeuCauAi;
import com.do_an_tot_nghiep.k28.ai.dto.AiHistoryItem;
import java.util.List;
import org.mapstruct.Mapping;
import tools.jackson.databind.JsonNode;
import org.mapstruct.Mapper;

@Mapper
public interface AiRequestMapper {

    @Mapping(target = "ketQua", source = "ketQua")
    AiRequestResponse toResponse(YeuCauAi yeuCau, List<CardDraftResponse> banNhap, JsonNode ketQua);

    AiHistoryItem toHistory(YeuCauAi yeuCau);

    CardDraftResponse toResponse(BanNhapTheAi banNhap, CardDraftData noiDung);
}
