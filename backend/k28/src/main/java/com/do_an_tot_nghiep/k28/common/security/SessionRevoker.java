package com.do_an_tot_nghiep.k28.common.security;

import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataAccessException;
import org.springframework.session.FindByIndexNameSessionRepository;
import org.springframework.session.Session;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SessionRevoker {

    private final FindByIndexNameSessionRepository<? extends Session> sessions;

    public void revokeAll(Long userId, String keepSessionId) {
        try {
            List<String> ids = sessions.findByPrincipalName(String.valueOf(userId)).keySet().stream()
                    .filter(id -> !id.equals(keepSessionId))
                    .toList();
            ids.forEach(sessions::deleteById);
        } catch (DataAccessException ex) {
            throw new ApiException(ErrorCode.DEPENDENCY_DOWN, "Hệ thống tạm thời gián đoạn, vui lòng thử lại sau");
        }
    }
}