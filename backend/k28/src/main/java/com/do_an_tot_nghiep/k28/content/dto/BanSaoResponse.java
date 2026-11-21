package com.do_an_tot_nghiep.k28.content.dto;

public record BanSaoResponse(
        String boGocId,
        String boGocTen,
        String tacGiaGoc,
        boolean boGocXemDuoc,
        boolean tuCongKhai
) {
}
