package com.do_an_tot_nghiep.k28.notification.service;

import com.do_an_tot_nghiep.k28.account.dto.ReminderTarget;
import com.do_an_tot_nghiep.k28.account.service.AccountService;
import java.time.DateTimeException;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReminderService {

    private final AccountService accountService;
    private final NotificationService notificationService;

    public int run(Instant now) {
        int created = 0;
        for (ReminderTarget target : accountService.reminderTargets()) {
            try {
                if (notificationService.remind(target, now)) {
                    created++;
                }
            } catch (DataAccessException | DateTimeException e) {
                log.warn("Study reminder will be retried for user {}: {}", target.id(), e.getMessage());
            }
        }
        return created;
    }
}
