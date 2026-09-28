package com.do_an_tot_nghiep.k28.common.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.time.Clock;
import java.time.Instant;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/public")
@RequiredArgsConstructor
@Tag(name = "Public", description = "API không cần đăng nhập")
public class PingController {

    private final Clock clock;

    public record PingResponse(String status, Instant serverTime) {
    }

    @GetMapping("/ping")
    @Operation(summary = "Kiểm tra API còn hoạt động")
    @SecurityRequirements
    PingResponse ping() {
        return new PingResponse("UP", clock.instant());
    }
}