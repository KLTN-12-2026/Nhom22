package com.do_an_tot_nghiep.k28.content.controller;

import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import com.do_an_tot_nghiep.k28.content.dto.FileResponse;
import com.do_an_tot_nghiep.k28.content.dto.LibraryCardQuery;
import com.do_an_tot_nghiep.k28.content.dto.LibraryDeckDetailResponse;
import com.do_an_tot_nghiep.k28.content.dto.LibraryDeckQuery;
import com.do_an_tot_nghiep.k28.content.dto.LibraryDeckResponse;
import com.do_an_tot_nghiep.k28.content.entity.enums.VaiTroTep;
import com.do_an_tot_nghiep.k28.content.service.LibraryMediaService;
import com.do_an_tot_nghiep.k28.content.service.LibraryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/library/decks")
public class LibraryController {

    private final LibraryService service;
    private final LibraryMediaService media;

    @GetMapping
    public PageResponse<LibraryDeckResponse> list(
            @Valid @ModelAttribute LibraryDeckQuery query
    ) {
        return service.list(query);
    }

    @GetMapping("/{id}")
    public LibraryDeckDetailResponse get(
            @PathVariable("id") Long id,
            @Valid @ModelAttribute LibraryCardQuery query
    ) {
        return service.get(id, query);
    }

    @GetMapping("/{id}/cards/{cardId}/files/{role}")
    public FileResponse file(
            @PathVariable("id") Long id,
            @PathVariable("cardId") Long cardId,
            @PathVariable("role") VaiTroTep role
    ) {
        return media.get(id, cardId, role);
    }
}
