package com.do_an_tot_nghiep.k28.speaking.controller;

import com.do_an_tot_nghiep.k28.common.security.CurrentUser;
import com.do_an_tot_nghiep.k28.speaking.dto.CardAudioResponse;
import com.do_an_tot_nghiep.k28.speaking.entity.enums.LoaiAmThanh;
import com.do_an_tot_nghiep.k28.speaking.service.TtsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/cards")
@RequiredArgsConstructor
public class CardAudioController {

    private final TtsService ttsService;
    private final CurrentUser currentUser;

    @GetMapping("/{id}/audio")
    public CardAudioResponse audio(@PathVariable("id") Long id,
                                   @RequestParam(name = "loai", defaultValue = "TU") LoaiAmThanh loai) {
        return ttsService.cardAudio(currentUser.id(), id, loai);
    }
}
