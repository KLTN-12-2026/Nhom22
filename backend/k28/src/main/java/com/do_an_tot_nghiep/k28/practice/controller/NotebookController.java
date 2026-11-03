package com.do_an_tot_nghiep.k28.practice.controller;

import com.do_an_tot_nghiep.k28.common.security.CurrentUser;
import com.do_an_tot_nghiep.k28.practice.dto.ConfusingPairResponse;
import com.do_an_tot_nghiep.k28.practice.dto.NotebookItemResponse;
import com.do_an_tot_nghiep.k28.practice.dto.NotebookQuery;
import com.do_an_tot_nghiep.k28.practice.dto.NotebookResponse;
import com.do_an_tot_nghiep.k28.practice.dto.UpdateNotebookRequest;
import com.do_an_tot_nghiep.k28.practice.service.NotebookService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class NotebookController {

    private final NotebookService notebookService;
    private final CurrentUser currentUser;

    @GetMapping("/notebook")
    public NotebookResponse list(@Valid @ModelAttribute NotebookQuery query) {
        return notebookService.list(currentUser.id(), query);
    }

    @PutMapping("/notebook/{cardId}")
    public NotebookItemResponse update(
            @PathVariable("cardId") Long cardId,
            @Valid @RequestBody UpdateNotebookRequest request
    ) {
        return notebookService.update(currentUser.id(), cardId, request);
    }

    @DeleteMapping("/notebook/{cardId}")
    public ResponseEntity<Void> remove(@PathVariable("cardId") Long cardId) {
        notebookService.remove(currentUser.id(), cardId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/learning/confusing-pairs")
    public List<ConfusingPairResponse> confusingPairs() {
        return notebookService.confusingPairs(currentUser.id());
    }
}
