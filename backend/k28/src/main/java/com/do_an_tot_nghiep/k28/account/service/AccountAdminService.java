package com.do_an_tot_nghiep.k28.account.service;

import com.do_an_tot_nghiep.k28.account.dto.UserAdminView;
import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.entity.VaiTro;
import com.do_an_tot_nghiep.k28.account.entity.enums.TrangThaiNguoiDung;
import com.do_an_tot_nghiep.k28.account.mapper.UserMapper;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import java.util.HashSet;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AccountAdminService {

    public static final String SYSTEM_EMAIL = "library-editor@vocab.local";

    private final NguoiDungRepository users;
    private final VaiTroRepository roles;
    private final UserMapper mapper;

    @Transactional(readOnly = true)
    public Page<UserAdminView> page(String q, TrangThaiNguoiDung trangThai, String vaiTro, Pageable pageable) {
        return users.adminPage(SYSTEM_EMAIL, likePattern(q), trangThai, vaiTro, pageable).map(mapper::toAdminView);
    }

    @Transactional(readOnly = true)
    public Long systemUserId() {
        return users.findByEmail(SYSTEM_EMAIL)
                .map(NguoiDung::getId)
                .orElseThrow(() -> new ApiException(ErrorCode.INTERNAL_ERROR, "Thiếu tài khoản hệ thống của thư viện"));
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public UserAdminView lockForChange(Long id) {
        roles.lockByMa(VaiTro.ADMIN).orElseThrow();
        return mapper.toAdminView(lockedUser(id));
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public long countActiveAdmins() {
        return users.countByRoleAndStatus(VaiTro.ADMIN, TrangThaiNguoiDung.HOAT_DONG);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public UserAdminView changeStatus(Long id, TrangThaiNguoiDung trangThai) {
        NguoiDung user = lockedUser(id);
        user.changeStatus(trangThai);
        users.flush();
        return mapper.toAdminView(user);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public UserAdminView changeRoles(Long id, boolean admin) {
        NguoiDung user = lockedUser(id);
        Set<VaiTro> next = new HashSet<>();
        next.add(roles.findByMa(VaiTro.USER).orElseThrow());
        if (admin) {
            next.add(roles.findByMa(VaiTro.ADMIN).orElseThrow());
        }
        user.replaceRoles(next);
        users.flush();
        return mapper.toAdminView(user);
    }

    private NguoiDung lockedUser(Long id) {
        return users.findForUpdate(id)
                .filter(user -> !SYSTEM_EMAIL.equals(user.getEmail()))
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy tài khoản"));
    }

    private static String likePattern(String q) {
        if (q == null || q.isBlank()) {
            return null;
        }
        String escaped = q.strip()
                .replace("!", "!!")
                .replace("%", "!%")
                .replace("_", "!_");
        return "%" + escaped + "%";
    }
}
