package com.do_an_tot_nghiep.k28.account.controller;

import com.do_an_tot_nghiep.k28.account.dto.ChooseThemeRequest;
import com.do_an_tot_nghiep.k28.account.dto.ThemeCatalogResponse;
import com.do_an_tot_nghiep.k28.account.dto.ThemeEventRequest;
import com.do_an_tot_nghiep.k28.account.dto.ThemeEventResponse;
import com.do_an_tot_nghiep.k28.account.service.ThemeService;
import com.do_an_tot_nghiep.k28.common.security.CurrentUser;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class ThemeController {

    private final ThemeService themes;
    private final CurrentUser currentUser;

    @GetMapping("/api/v1/me/themes")
    public ThemeCatalogResponse catalog() {
        return themes.catalog(currentUser.id());
    }

    @PutMapping("/api/v1/me/theme")
    public ThemeCatalogResponse choose(@Valid @RequestBody ChooseThemeRequest request) {
        return themes.choose(currentUser.id(), request);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/api/v1/admin/theme-events")
    public List<ThemeEventResponse> events() {
        return themes.adminEvents(currentUser.id());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/api/v1/admin/theme-events")
    @ResponseStatus(HttpStatus.CREATED)
    public ThemeEventResponse createEvent(@Valid @RequestBody ThemeEventRequest request) {
        return themes.createEvent(currentUser.id(), request);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/api/v1/admin/theme-events/{id}")
    public ThemeEventResponse updateEvent(@PathVariable Long id, @Valid @RequestBody ThemeEventRequest request) {
        return themes.updateEvent(currentUser.id(), id, request);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/api/v1/admin/theme-events/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteEvent(@PathVariable Long id) {
        themes.deleteEvent(id);
    }
}
