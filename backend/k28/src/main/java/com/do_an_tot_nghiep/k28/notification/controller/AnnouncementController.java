package com.do_an_tot_nghiep.k28.notification.controller;

import com.do_an_tot_nghiep.k28.notification.dto.AnnouncementResponse;
import com.do_an_tot_nghiep.k28.notification.service.AnnouncementService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService service;

    @GetMapping("/api/v1/announcements")
    public List<AnnouncementResponse> active() {
        return service.active();
    }
}
