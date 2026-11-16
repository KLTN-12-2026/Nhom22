package com.do_an_tot_nghiep.k28.content.service;

import com.do_an_tot_nghiep.k28.billing.service.EntitlementService;
import com.do_an_tot_nghiep.k28.content.repository.TheTuVungRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CardLimitService {

    private final EntitlementService entitlements;
    private final TheTuVungRepository cards;

    public void requireCapacity(Long userId, long soTheThem) {
        entitlements.requireCardCapacity(userId, soTheThem, () -> cards.countActiveOwnedBy(userId));
    }
}
