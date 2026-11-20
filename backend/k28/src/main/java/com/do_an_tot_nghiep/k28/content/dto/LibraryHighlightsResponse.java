package com.do_an_tot_nghiep.k28.content.dto;

import java.time.Instant;
import java.util.List;

public record LibraryHighlightsResponse(
        Instant tuLuc,
        Instant denLuc,
        List<HighlightDeck> yeuThichTuan,
        List<HighlightDeck> yeuThichNhieuNhat,
        List<Contributor> dongGopTuan
) {

    public record HighlightDeck(LibraryDeckResponse boThe, long soYeuThich) {
    }

    public record Contributor(
            String chuSoHuuId,
            String tenTacGia,
            long soBoCongKhai,
            long soYeuThich,
            long soSaoChep
    ) {
    }
}
