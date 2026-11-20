package com.do_an_tot_nghiep.k28.content.controller;

import com.do_an_tot_nghiep.k28.content.dto.LibraryHighlightsResponse;
import com.do_an_tot_nghiep.k28.content.service.LibraryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class LibraryHighlightController {

    private final LibraryService service;

    @GetMapping("/api/v1/library/highlights")
    public LibraryHighlightsResponse highlights() {
        return service.highlights();
    }
}
