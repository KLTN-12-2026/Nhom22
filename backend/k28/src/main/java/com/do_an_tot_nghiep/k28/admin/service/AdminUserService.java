package com.do_an_tot_nghiep.k28.admin.service;

import com.do_an_tot_nghiep.k28.common.realtime.LoaiSuKien;
import com.do_an_tot_nghiep.k28.common.realtime.RealtimeService;
import com.do_an_tot_nghiep.k28.account.dto.UserAdminView;
import com.do_an_tot_nghiep.k28.account.entity.VaiTro;
import com.do_an_tot_nghiep.k28.account.entity.enums.TrangThaiNguoiDung;
import com.do_an_tot_nghiep.k28.account.service.AccountAdminService;
import com.do_an_tot_nghiep.k28.admin.dto.AdminUserResponse;
import com.do_an_tot_nghiep.k28.admin.dto.AvatarVisibilityRequest;
import com.do_an_tot_nghiep.k28.admin.dto.UserRolesRequest;
import com.do_an_tot_nghiep.k28.admin.dto.UserStatusRequest;
import com.do_an_tot_nghiep.k28.admin.entity.enums.HanhDongQuanTri;
import com.do_an_tot_nghiep.k28.admin.entity.enums.LoaiDoiTuong;
import com.do_an_tot_nghiep.k28.admin.mapper.AdminMapper;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.mail.MailService;
import com.do_an_tot_nghiep.k28.notification.entity.enums.LoaiThongBao;
import com.do_an_tot_nghiep.k28.notification.service.NotificationService;
import com.do_an_tot_nghiep.k28.common.security.SessionRevoker;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import com.do_an_tot_nghiep.k28.content.service.DeckService;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.util.HtmlUtils;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private static final Set<String> ROLES = Set.of(VaiTro.USER, VaiTro.ADMIN);
    private static final String PROFILE_LINK = "/ca-nhan";

    private final AccountAdminService accounts;
    private final DeckService decks;
    private final AuditService audit;
    private final SessionRevoker sessions;
    private final AdminMapper mapper;
    private final PlatformTransactionManager txManager;
    private final RealtimeService realtime;
    private final NotificationService notifications;
    private final MailService mail;

    public record RolesResult(AdminUserResponse user, boolean banThanMatQuyen) {
    }

    public PageResponse<AdminUserResponse> list(String q, TrangThaiNguoiDung trangThai, String vaiTro, int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "page phải không âm, size từ 1 đến 100");
        }
        if (vaiTro != null && !ROLES.contains(vaiTro)) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "vaiTro", "Vai trò phải là USER hoặc ADMIN");
        }
        if (q != null && q.length() > 150) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "q", "Từ khóa tối đa 150 ký tự");
        }
        Page<UserAdminView> result = accounts.page(q, trangThai, vaiTro, PageRequest.of(page, size));
        Map<Long, Long> deckCounts = decks.countByOwners(
                result.getContent().stream().map(user -> Long.valueOf(user.id())).toList());
        return PageResponse.of(result.map(user -> mapper.toResponse(
                user, Math.toIntExact(deckCounts.getOrDefault(Long.valueOf(user.id()), 0L)), null, null)));
    }

    public AdminUserResponse changeStatus(Long actorId, Long id, UserStatusRequest request) {
        TrangThaiNguoiDung next = request.trangThai();
        if (next != TrangThaiNguoiDung.HOAT_DONG && next != TrangThaiNguoiDung.BI_KHOA) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "trangThai", "Chọn khóa hoặc mở khóa");
        }
        if (id.equals(actorId)) {
            throw selfLock();
        }
        boolean[] changed = new boolean[1];
        UserAdminView view = new TransactionTemplate(txManager).execute(status -> {
            UserAdminView target = accounts.lockForChange(id);
            TrangThaiNguoiDung current = changeableStatus(target);
            if (current == next) {
                return target;
            }
            UserAdminView after = applyStatus(target, next, request.lyDo());
            changed[0] = true;
            audit.record(actorId,
                    next == TrangThaiNguoiDung.BI_KHOA ? HanhDongQuanTri.KHOA_TAI_KHOAN : HanhDongQuanTri.MO_KHOA_TAI_KHOAN,
                    LoaiDoiTuong.NGUOI_DUNG, id, target.tenHienThi(), request.lyDo(),
                    Map.of("trangThai", current.name()), Map.of("trangThai", next.name()));
            return after;
        });
        int revoked = next == TrangThaiNguoiDung.BI_KHOA && changed[0] ? sessions.revokeAll(id, null) : 0;
        return mapper.toResponse(view, soBoThe(id), revoked, null);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public boolean lockFromReport(Long actorId, Long id, String lyDo) {
        if (id.equals(actorId)) {
            throw selfLock();
        }
        UserAdminView target = accounts.lockForChange(id);
        if (changeableStatus(target) == TrangThaiNguoiDung.BI_KHOA) {
            return false;
        }
        applyStatus(target, TrangThaiNguoiDung.BI_KHOA, lyDo);
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                sessions.revokeAll(id, null);
            }
        });
        return true;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public UserAdminView hideAvatarFromReport(Long id, Long fileId, String lyDo) {
        UserAdminView after = accounts.hideAvatar(id, fileId);
        notifyAvatarHidden(id, lyDo);
        return after;
    }

    public AdminUserResponse changeAvatar(Long actorId, Long id, AvatarVisibilityRequest request) {
        UserAdminView view = new TransactionTemplate(txManager).execute(status -> {
            UserAdminView target = accounts.lockForChange(id);
            if (request.an() == target.anhDaiDienBiAn()) {
                return target;
            }
            UserAdminView after = request.an() ? accounts.hideAvatar(id, null) : accounts.showAvatar(id);
            if (request.an()) {
                notifyAvatarHidden(id, request.lyDo());
            }
            audit.record(actorId, request.an() ? HanhDongQuanTri.AN_ANH_DAI_DIEN : HanhDongQuanTri.HIEN_ANH_DAI_DIEN,
                    LoaiDoiTuong.NGUOI_DUNG, id, target.tenHienThi(), request.lyDo(),
                    Map.of("anhDaiDienBiAn", target.anhDaiDienBiAn()),
                    Map.of("anhDaiDienBiAn", after.anhDaiDienBiAn()));
            return after;
        });
        return mapper.toResponse(view, soBoThe(id), null, null);
    }

    private TrangThaiNguoiDung changeableStatus(UserAdminView target) {
        TrangThaiNguoiDung current = TrangThaiNguoiDung.valueOf(target.trangThai());
        if (current == TrangThaiNguoiDung.DANG_XOA) {
            throw new ApiException(ErrorCode.BUSINESS_RULE, "Tài khoản đang trong quá trình xóa, không đổi trạng thái được");
        }
        if (current == TrangThaiNguoiDung.CHUA_XAC_THUC) {
            throw new ApiException(ErrorCode.BUSINESS_RULE, "Tài khoản chưa xác thực email. Người dùng cần tự xác thực qua thư");
        }
        return current;
    }

    private UserAdminView applyStatus(UserAdminView target, TrangThaiNguoiDung next, String lyDo) {
        Long id = Long.valueOf(target.id());
        if (next == TrangThaiNguoiDung.BI_KHOA && target.vaiTro().contains(VaiTro.ADMIN)
                && accounts.countActiveAdmins() <= 1) {
            throw new ApiException(ErrorCode.BUSINESS_RULE, "Không thể khóa quản trị viên cuối cùng");
        }
        UserAdminView after = accounts.changeStatus(id, next);
        if (next == TrangThaiNguoiDung.BI_KHOA) {
            realtime.toUser(id, LoaiSuKien.TAI_KHOAN_BI_KHOA, null);
            mail.send(target.email(), "Tài khoản VocabLearning đã bị khóa", lockHtml(target.tenHienThi(), lyDo));
        }
        return after;
    }

    private void notifyAvatarHidden(Long id, String lyDo) {
        notifications.create(id, LoaiThongBao.ANH_DAI_DIEN_BI_AN, null, "Ảnh đại diện đã bị ẩn",
                "Ảnh đại diện của bạn bị ẩn vì vi phạm quy định cộng đồng: " + lyDo
                        + ". Mọi người đang thấy ảnh mặc định, bạn có thể tải ảnh khác.",
                PROFILE_LINK, true, false);
    }

    private static String lockHtml(String tenHienThi, String lyDo) {
        return "<p>Chào " + HtmlUtils.htmlEscape(tenHienThi) + ",</p>"
                + "<p>Tài khoản VocabLearning của bạn đã bị quản trị viên khóa. Lý do: "
                + HtmlUtils.htmlEscape(lyDo) + "</p>"
                + "<p>Trong thời gian bị khóa, bạn không đăng nhập được, các bộ thẻ công khai và hồ sơ của bạn "
                + "bị ẩn khỏi thư viện. Nếu cho rằng đây là nhầm lẫn, hãy trả lời thư này để liên hệ quản trị viên.</p>";
    }

    private static ApiException selfLock() {
        return new ApiException(ErrorCode.BUSINESS_RULE, "Bạn không thể tự khóa hoặc mở khóa tài khoản của mình");
    }

    public RolesResult changeRoles(Long actorId, Long id, UserRolesRequest request, String currentSessionId) {
        Set<String> requested = new HashSet<>(request.vaiTro());
        if (requested.size() != request.vaiTro().size() || !requested.contains(VaiTro.USER)
                || !ROLES.containsAll(requested)) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "vaiTro", "Vai trò phải gồm USER, có thể thêm ADMIN");
        }
        boolean will = requested.contains(VaiTro.ADMIN);
        boolean self = id.equals(actorId);
        boolean[] changed = new boolean[1];
        UserAdminView view = new TransactionTemplate(txManager).execute(status -> {
            UserAdminView target = accounts.lockForChange(id);
            boolean had = target.vaiTro().contains(VaiTro.ADMIN);
            TrangThaiNguoiDung current = TrangThaiNguoiDung.valueOf(target.trangThai());
            if (had && !will && current == TrangThaiNguoiDung.HOAT_DONG && accounts.countActiveAdmins() <= 1) {
                throw new ApiException(ErrorCode.BUSINESS_RULE,
                        "Không thể thu quyền của quản trị viên cuối cùng. Cấp quyền cho một người khác trước");
            }
            if (!had && will && current != TrangThaiNguoiDung.HOAT_DONG) {
                throw new ApiException(ErrorCode.BUSINESS_RULE, "Chỉ cấp quyền quản trị cho tài khoản đang hoạt động");
            }
            if (target.vaiTro().equals(requested)) {
                return target;
            }
            UserAdminView after = accounts.changeRoles(id, will);
            if (had != will) {
                changed[0] = true;
                audit.record(actorId,
                        will ? HanhDongQuanTri.CAP_QUYEN_QUAN_TRI : HanhDongQuanTri.THU_QUYEN_QUAN_TRI,
                        LoaiDoiTuong.NGUOI_DUNG, id, target.tenHienThi(), request.lyDo(),
                        Map.of("vaiTro", sorted(target.vaiTro())), Map.of("vaiTro", sorted(after.vaiTro())));
            }
            return after;
        });
        int revoked = 0;
        boolean lostAdmin = false;
        if (changed[0]) {
            revoked = sessions.revokeAll(id, self ? currentSessionId : null);
            lostAdmin = self && !will;
            if (lostAdmin && currentSessionId != null) {
                revoked++;
            }
        }
        return new RolesResult(mapper.toResponse(view, soBoThe(id), revoked, lostAdmin), lostAdmin);
    }

    private int soBoThe(Long id) {
        return Math.toIntExact(decks.countByOwners(List.of(id)).getOrDefault(id, 0L));
    }

    private static List<String> sorted(Set<String> roles) {
        return roles.stream().sorted().toList();
    }
}
