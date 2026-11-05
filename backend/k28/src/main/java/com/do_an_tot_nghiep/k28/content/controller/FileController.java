package com.do_an_tot_nghiep.k28.content.controller;

import com.do_an_tot_nghiep.k28.common.security.CurrentUser;
import com.do_an_tot_nghiep.k28.content.dto.FileResponse;
import com.do_an_tot_nghiep.k28.content.dto.UploadRequest;
import com.do_an_tot_nghiep.k28.content.dto.UploadRequestResponse;
import com.do_an_tot_nghiep.k28.content.service.FileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService files;
    private final CurrentUser currentUser;

    @PostMapping("/upload-requests")
    @ResponseStatus(HttpStatus.CREATED)
    public UploadRequestResponse request(@Valid @RequestBody UploadRequest request) {
        return files.requestUpload(currentUser.id(), request);
    }

    @PostMapping("/{id}/complete")
    public FileResponse complete(@PathVariable("id") Long id) {
        return files.complete(currentUser.id(), id);
    }

    @GetMapping("/{id}")
    public FileResponse get(@PathVariable("id") Long id) {
        return files.get(currentUser.id(), id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable("id") Long id) {
        files.delete(currentUser.id(), id);
    }
}
