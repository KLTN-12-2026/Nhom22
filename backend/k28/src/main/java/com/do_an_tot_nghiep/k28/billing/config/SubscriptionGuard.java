package com.do_an_tot_nghiep.k28.billing.config;

import com.do_an_tot_nghiep.k28.billing.entity.DangKyGoi;
import com.do_an_tot_nghiep.k28.billing.entity.enums.TrangThaiDangKy;
import com.do_an_tot_nghiep.k28.billing.service.EntitlementService;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.security.AuthUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class SubscriptionGuard implements HandlerInterceptor {

    private final EntitlementService entitlements;
    private final BillingProperties props;

    public SubscriptionGuard(@Lazy EntitlementService entitlements, BillingProperties props) {
        this.entitlements = entitlements;
        this.props = props;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!props.enforce()) {
            return true;
        }
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof AuthUser user) || user.roles().contains("ADMIN")) {
            return true;
        }
        if (entitlements.current(user.id()).isPresent()) {
            return true;
        }
        Optional<DangKyGoi> ganNhat = entitlements.latest(user.id());
        boolean daHuy = ganNhat.map(item -> item.getTrangThai() == TrangThaiDangKy.DA_HUY).orElse(false);
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("lyDo", daHuy ? "DA_HUY" : ganNhat.isPresent() ? "HET_HAN" : "CHUA_CO_GOI");
        details.put("goiGanNhat", ganNhat.map(DangKyGoi::getGoiMa).orElse(null));
        details.put("hetHanAt", ganNhat.map(DangKyGoi::getHetHanAt).orElse(null));
        throw new ApiException(ErrorCode.SUBSCRIPTION_REQUIRED, daHuy
                ? "Gói dịch vụ của bạn đã được hủy. Mua gói để tiếp tục học, dữ liệu của bạn vẫn được giữ nguyên"
                : ganNhat.isPresent()
                ? "Gói dịch vụ của bạn đã hết hạn. Gia hạn để tiếp tục học, dữ liệu của bạn vẫn được giữ nguyên"
                : "Bạn cần mua gói dịch vụ để dùng chức năng này", details);
    }
}
