package com.do_an_tot_nghiep.k28.speaking.controller;

import com.do_an_tot_nghiep.k28.common.security.CurrentUser;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import com.do_an_tot_nghiep.k28.speaking.dto.PronunciationHistoryItem;
import com.do_an_tot_nghiep.k28.speaking.dto.PronunciationHistoryQuery;
import com.do_an_tot_nghiep.k28.speaking.dto.PronunciationResponse;
import com.do_an_tot_nghiep.k28.speaking.service.PronunciationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/pronunciation")
@RequiredArgsConstructor
public class PronunciationController {

    private final PronunciationService pronunciationService;
    private final CurrentUser currentUser;

    @PostMapping(value = "/assessments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public PronunciationResponse assess(@RequestParam("theId") Long theId,
                                        @RequestPart(name = "file", required = false) MultipartFile file) {
        return pronunciationService.assess(currentUser.id(), theId, file);
    }

    @GetMapping("/assessments/{id}")
    public PronunciationResponse get(@PathVariable("id") Long id) {
        return pronunciationService.get(currentUser.id(), id);
    }

    @GetMapping("/history")
    public PageResponse<PronunciationHistoryItem> history(@Valid @ModelAttribute PronunciationHistoryQuery query) {
        return pronunciationService.history(currentUser.id(), query);
    }

    @DeleteMapping("/recordings/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRecording(@PathVariable("id") Long id) {
        pronunciationService.deleteRecording(currentUser.id(), id);
    }
}
