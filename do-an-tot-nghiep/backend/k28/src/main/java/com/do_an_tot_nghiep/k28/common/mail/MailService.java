package com.do_an_tot_nghiep.k28.common.mail;

import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MailService {

    private final ApplicationEventPublisher events;

    public void send(String to, String subject, String html) {
        events.publishEvent(new MailRequestedEvent(to, subject, html));
    }
}
