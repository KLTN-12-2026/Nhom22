package com.do_an_tot_nghiep.k28.common.mail;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.support.TransactionTemplate;

class MailServiceTest extends AbstractIntegrationTest {

    private final HttpClient http = HttpClient.newHttpClient();

    @Autowired
    MailService mailService;

    @Autowired
    TransactionTemplate tx;

    @Test
    void sendsAfterCommit() {
        String subject = "commit-" + UUID.randomUUID();

        tx.executeWithoutResult(status -> mailService.send("an@vocab.local", subject, "<p>Xin chào</p>"));

        await().atMost(Duration.ofSeconds(10)).until(() -> mailbox().contains(subject));
    }

    @Test
    void doesNotSendWhenTransactionRollsBack() throws Exception {
        String rolledBack = "rollback-" + UUID.randomUUID();
        String marker = "marker-" + UUID.randomUUID();

        tx.executeWithoutResult(status -> {
            mailService.send("an@vocab.local", rolledBack, "<p>x</p>");
            status.setRollbackOnly();
        });
        tx.executeWithoutResult(status -> mailService.send("an@vocab.local", marker, "<p>x</p>"));

        await().atMost(Duration.ofSeconds(10)).until(() -> mailbox().contains(marker));
        assertThat(mailbox()).doesNotContain(rolledBack);
    }

    private String mailbox() throws Exception {
        return http.send(HttpRequest.newBuilder(URI.create(mailpitApi() + "/messages")).GET().build(),
                HttpResponse.BodyHandlers.ofString()).body();
    }
}
