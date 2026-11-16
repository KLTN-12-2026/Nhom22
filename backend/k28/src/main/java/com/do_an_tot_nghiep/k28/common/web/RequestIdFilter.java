package com.do_an_tot_nghiep.k28.common.web;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;
import java.util.regex.Pattern;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestIdFilter extends OncePerRequestFilter {

    public static final String HEADER = "X-Request-Id";
    public static final String MDC_KEY = "requestId";
    private static final Pattern SAFE_ID = Pattern.compile("[A-Za-z0-9-]{8,64}");
    private static final Logger ACCESS = LoggerFactory.getLogger("access");

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String incoming = request.getHeader(HEADER);
        String requestId = incoming != null && SAFE_ID.matcher(incoming).matches()
                ? incoming
                : UUID.randomUUID().toString();
        MDC.put(MDC_KEY, requestId);
        response.setHeader(HEADER, requestId);
        long start = System.nanoTime();
        boolean failed = false;
        try {
            chain.doFilter(request, response);
        } catch (IOException | ServletException | RuntimeException ex) {
            failed = true;
            throw ex;
        } finally {
            logAccess(request, response, start, failed);
            MDC.remove(MDC_KEY);
        }
    }

    private void logAccess(HttpServletRequest request, HttpServletResponse response, long start, boolean failed) {
        String path = request.getRequestURI();
        if (!ACCESS.isInfoEnabled() || !path.startsWith("/api/")) {
            return;
        }
        int status = failed ? HttpServletResponse.SC_INTERNAL_SERVER_ERROR : response.getStatus();
        long ms = (System.nanoTime() - start) / 1_000_000;
        ACCESS.atInfo()
                .addKeyValue("http.method", request.getMethod())
                .addKeyValue("url.path", path)
                .addKeyValue("http.status", status)
                .addKeyValue("durationMs", ms)
                .log("{} {} {} {}ms", request.getMethod(), path, status, ms);
    }
}