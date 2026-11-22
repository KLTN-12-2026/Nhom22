package com.do_an_tot_nghiep.k28.dictionary.controller;

import com.do_an_tot_nghiep.k28.dictionary.dto.DictionaryEntryResponse;
import com.do_an_tot_nghiep.k28.dictionary.dto.DictionaryLookupResponse;
import com.do_an_tot_nghiep.k28.dictionary.dto.DictionaryQuery;
import com.do_an_tot_nghiep.k28.dictionary.dto.DictionarySuggestionResponse;
import com.do_an_tot_nghiep.k28.dictionary.service.DictionaryService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/dictionary")
public class DictionaryController {

    private final DictionaryService service;

    @GetMapping("/suggest")
    public List<DictionarySuggestionResponse> suggest(@Valid @ModelAttribute DictionaryQuery query) {
        return service.suggest(query);
    }

    @GetMapping("/by-meaning")
    public List<DictionarySuggestionResponse> byMeaning(@Valid @ModelAttribute DictionaryQuery query) {
        return service.byMeaning(query);
    }

    @GetMapping("/lookup")
    public DictionaryLookupResponse lookup(@Valid @ModelAttribute DictionaryQuery query) {
        return service.lookup(query);
    }

    @GetMapping("/entries/{id}")
    public DictionaryEntryResponse entry(@PathVariable("id") Long id) {
        return service.get(id);
    }
}
