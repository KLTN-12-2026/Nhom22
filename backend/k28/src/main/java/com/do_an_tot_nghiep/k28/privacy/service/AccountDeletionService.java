package com.do_an_tot_nghiep.k28.privacy.service;

import com.do_an_tot_nghiep.k28.account.dto.UserAdminView;
import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.entity.VaiTro;
import com.do_an_tot_nghiep.k28.account.entity.enums.TrangThaiNguoiDung;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.service.AccountAdminService;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.job.JobService;
import com.do_an_tot_nghiep.k28.common.security.SessionRevoker;
import com.do_an_tot_nghiep.k28.privacy.dto.DeletionRequest;
import com.do_an_tot_nghiep.k28.privacy.dto.DeletionRequestResponse;
import com.do_an_tot_nghiep.k28.privacy.entity.YeuCauXoaDuLieu;
import com.do_an_tot_nghiep.k28.privacy.entity.enums.TrangThaiYeuCauXoa;
import com.do_an_tot_nghiep.k28.privacy.repository.YeuCauXoaDuLieuRepository;
import java.time.Clock;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

@Service
@RequiredArgsConstructor
public class AccountDeletionService {

    private static final List<TrangThaiYeuCauXoa> DANG_MO = List.of(TrangThaiYeuCauXoa.CHO_XU_LY,
            TrangThaiYeuCauXoa.DANG_XU_LY);

    private final YeuCauXoaDuLieuRepository requests;
    private final NguoiDungRepository users;
    private final AccountAdminService accounts;
    private final PasswordEncoder passwords;
    private final JobService jobs;
    private final SessionRevoker sessions;
    private final TransactionTemplate tx;
    private final Clock clock;

    public DeletionRequestResponse request(Long userId, String currentSessionId, DeletionRequest request) {
        YeuCauXoaDuLieu yeuCau = tx.execute(status -> {
            UserAdminView target = accounts.lockForChange(userId);
            var dangMo = requests.findFirstByNguoiDungIdAndTrangThaiIn(userId, DANG_MO);
            if (dangMo.isPresent()) {
                return dangMo.get();
            }
            NguoiDung user = users.findById(userId)
                    .orElseThrow(() -> new ApiException(ErrorCode.UNAUTHENTICATED, "Bạn cần đăng nhập để tiếp tục"));
            if (!user.getEmail().equalsIgnoreCase(request.xacNhan().strip())) {
                throw new ApiException(ErrorCode.VALIDATION_FAILED, "xacNhan",
                        "Email xác nhận không khớp với email của tài khoản");
            }
            if (user.getPasswordHash() != null
                    && (request.matKhau() == null || !passwords.matches(request.matKhau(), user.getPasswordHash()))) {
                throw new ApiException(ErrorCode.VALIDATION_FAILED, "matKhau", "Mật khẩu không đúng");
            }
            if (target.vaiTro().contains(VaiTro.ADMIN)
                    && TrangThaiNguoiDung.HOAT_DONG.name().equals(target.trangThai())
                    && accounts.countActiveAdmins() <= 1) {
                throw new ApiException(ErrorCode.BUSINESS_RULE,
                        "Không thể xóa tài khoản quản trị viên cuối cùng. Hãy cấp quyền cho người khác trước");
            }
            accounts.changeStatus(userId, TrangThaiNguoiDung.DANG_XOA);
            YeuCauXoaDuLieu moi = requests.saveAndFlush(YeuCauXoaDuLieu.moi(userId, clock.instant()));
            jobs.enqueue(AccountDeletionJobHandler.LOAI,
                    new AccountDeletionPayload(moi.getId(), userId, user.getEmail(), user.getTenHienThi()));
            return moi;
        });
        sessions.revokeAll(userId, currentSessionId);
        return new DeletionRequestResponse(yeuCau.getId().toString(), yeuCau.getPhamVi(), yeuCau.getTrangThai(),
                yeuCau.getYeuCauAt());
    }
}
