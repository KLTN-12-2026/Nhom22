package com.do_an_tot_nghiep.k28.content.controller;

import com.do_an_tot_nghiep.k28.common.security.CurrentUser;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import com.do_an_tot_nghiep.k28.content.dto.AuthorProfileResponse;
import com.do_an_tot_nghiep.k28.content.dto.LibraryAuthorResponse;
import com.do_an_tot_nghiep.k28.content.dto.LibrarySearchCardResponse;
import com.do_an_tot_nghiep.k28.content.dto.LibrarySearchQuery;
import com.do_an_tot_nghiep.k28.content.dto.LibrarySuggestQuery;
import com.do_an_tot_nghiep.k28.content.dto.LibrarySuggestResponse;
import com.do_an_tot_nghiep.k28.content.service.LibrarySearchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/library")
public class LibrarySearchController {

    private final LibrarySearchService service;
    private final CurrentUser currentUser;

    @GetMapping("/search")
    public LibrarySuggestResponse suggest(@Valid @ModelAttribute LibrarySuggestQuery query) {
        return service.suggest(query, currentUser.optionalId().orElse(null));
    }

    @GetMapping("/search/cards")
    public PageResponse<LibrarySearchCardResponse> cards(@Valid @ModelAttribute LibrarySearchQuery query) {
        return service.cards(query);
    }

    @GetMapping("/search/authors")
    public PageResponse<LibraryAuthorResponse> authors(@Valid @ModelAttribute LibrarySearchQuery query) {
        return service.authors(query);
    }

    @GetMapping("/authors/{id}")
    public AuthorProfileResponse author(@PathVariable("id") Long id) {
        return service.author(id);
    }
}
