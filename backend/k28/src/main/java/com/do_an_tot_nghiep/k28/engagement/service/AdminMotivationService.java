package com.do_an_tot_nghiep.k28.engagement.service;

import com.do_an_tot_nghiep.k28.admin.entity.enums.HanhDongQuanTri;
import com.do_an_tot_nghiep.k28.admin.entity.enums.LoaiDoiTuong;
import com.do_an_tot_nghiep.k28.admin.service.AuditService;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import com.do_an_tot_nghiep.k28.engagement.dto.*;
import com.do_an_tot_nghiep.k28.engagement.entity.HuyHieu;
import com.do_an_tot_nghiep.k28.engagement.entity.ThuThach;
import com.do_an_tot_nghiep.k28.engagement.repository.HuyHieuRepository;
import com.do_an_tot_nghiep.k28.engagement.repository.ThuThachRepository;
import com.do_an_tot_nghiep.k28.engagement.repository.TienDoThuThachRepository;
import java.util.Map;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Transactional(readOnly = true)
public class AdminMotivationService {

    private final HuyHieuRepository badges;
    private final ThuThachRepository challenges;
    private final TienDoThuThachRepository progress;
    private final AuditService audit;

    public PageResponse<AdminBadgeResponse> badges(int page, int size) {
        validatePaging(page, size);
        return PageResponse.of(badges.findAll(PageRequest.of(page, size,
                org.springframework.data.domain.Sort.by("thuTu", "id"))).map(this::badgeResponse));
    }

    public PageResponse<AdminChallengeResponse> challenges(int page, int size) {
        validatePaging(page, size);
        return PageResponse.of(challenges.findAll(PageRequest.of(page, size,
                org.springframework.data.domain.Sort.by("id"))).map(this::challengeResponse));
    }

    @Transactional
    public AdminBadgeResponse createBadge(Long adminId, BadgeWriteRequest request) {
        if (badges.existsByMa(request.ma())) throw duplicateCode();
        HuyHieu badge = badges.saveAndFlush(HuyHieu.create(request.ma(), request.ten(), request.moTa(),
                request.loaiDieuKien(), request.nguong(), request.thuTu(), request.hoatDong()));
        audit.record(adminId, HanhDongQuanTri.TAO_HUY_HIEU, LoaiDoiTuong.HUY_HIEU,
                badge.getId(), badge.getTen(), null, null, badgeSnapshot(badge));
        return badgeResponse(badge);
    }

    @Transactional
    public AdminBadgeResponse updateBadge(Long adminId, Long id, BadgeWriteRequest request) {
        HuyHieu badge = badges.findForUpdate(id).orElseThrow(() ->
                new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy huy hiệu"));
        validateVersion(badge.getVersion(), request.version());
        validateImmutableCode(badge.getMa(), request.ma());
        Map<String, ?> before = badgeSnapshot(badge);
        badge.update(request.ten(), request.moTa(), request.loaiDieuKien(), request.nguong(), request.thuTu(), request.hoatDong());
        badges.saveAndFlush(badge);
        audit.record(adminId, HanhDongQuanTri.SUA_HUY_HIEU, LoaiDoiTuong.HUY_HIEU,
                id, badge.getTen(), null, before, badgeSnapshot(badge));
        return badgeResponse(badge);
    }

    @Transactional
    public AdminChallengeResponse createChallenge(Long adminId, ChallengeWriteRequest request) {
        if (challenges.existsByMa(request.ma())) throw duplicateCode();
        ThuThach challenge = challenges.saveAndFlush(ThuThach.create(request.ma(), request.ten(), request.moTa(),
                request.loaiDieuKien(), request.chuKy(), request.mucTieu(), request.hoatDong()));
        audit.record(adminId, HanhDongQuanTri.TAO_THU_THACH, LoaiDoiTuong.THU_THACH,
                challenge.getId(), challenge.getTen(), null, null, challengeSnapshot(challenge));
        return challengeResponse(challenge);
    }

    @Transactional
    public AdminChallengeResponse updateChallenge(Long adminId, Long id, ChallengeWriteRequest request) {
        // RewardService holds a shared lock on this definition until its progress update commits.
        // The exclusive lock also closes the race between checking progress and first participation.
        ThuThach challenge = challenges.findForUpdate(id).orElseThrow(() ->
                new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy thử thách"));
        validateVersion(challenge.getVersion(), request.version());
        validateImmutableCode(challenge.getMa(), request.ma());
        boolean changedRule = challenge.getMucTieu() != request.mucTieu()
                || challenge.getLoaiDieuKien() != request.loaiDieuKien() || challenge.getChuKy() != request.chuKy();
        if (changedRule && progress.existsByThuThachId(id)) {
            throw new ApiException(ErrorCode.BUSINESS_RULE, "mucTieu",
                    "Thử thách đã có người tham gia; tạo thử thách mới để đổi mục tiêu hoặc điều kiện");
        }
        Map<String, ?> before = challengeSnapshot(challenge);
        challenge.update(request.ten(), request.moTa(), request.loaiDieuKien(), request.chuKy(), request.mucTieu(), request.hoatDong());
        challenges.saveAndFlush(challenge);
        audit.record(adminId, HanhDongQuanTri.SUA_THU_THACH, LoaiDoiTuong.THU_THACH,
                id, challenge.getTen(), null, before, challengeSnapshot(challenge));
        return challengeResponse(challenge);
    }

    private AdminBadgeResponse badgeResponse(HuyHieu row) {
        return new AdminBadgeResponse(String.valueOf(row.getId()), row.getMa(), row.getTen(), row.getMoTa(),
                row.getLoaiDieuKien(), row.getNguong(), row.getThuTu(), row.isHoatDong(), row.getVersion());
    }

    private AdminChallengeResponse challengeResponse(ThuThach row) {
        return new AdminChallengeResponse(String.valueOf(row.getId()), row.getMa(), row.getTen(), row.getMoTa(),
                row.getLoaiDieuKien(), row.getChuKy(), row.getMucTieu(), row.isHoatDong(), row.getVersion());
    }

    private Map<String, ?> badgeSnapshot(HuyHieu row) {
        return Map.of("ma", row.getMa(), "ten", row.getTen(), "moTa", row.getMoTa(),
                "loaiDieuKien", row.getLoaiDieuKien(), "nguong", row.getNguong(), "thuTu", row.getThuTu(),
                "hoatDong", row.isHoatDong(), "version", row.getVersion());
    }

    private Map<String, ?> challengeSnapshot(ThuThach row) {
        return Map.of("ma", row.getMa(), "ten", row.getTen(), "moTa", row.getMoTa(),
                "loaiDieuKien", row.getLoaiDieuKien(), "chuKy", row.getChuKy(), "mucTieu", row.getMucTieu(),
                "hoatDong", row.isHoatDong(), "version", row.getVersion());
    }

    private void validatePaging(int page, int size) {
        if (page < 0) throw new ApiException(ErrorCode.VALIDATION_FAILED, "page", "Trang phải không âm");
        if (size < 1 || size > 100) throw new ApiException(ErrorCode.VALIDATION_FAILED, "size", "Kích thước trang từ 1 đến 100");
    }

    private void validateVersion(Long current, Long supplied) {
        if (supplied == null) throw new ApiException(ErrorCode.VALIDATION_FAILED, "version", "Thiếu phiên bản, vui lòng tải lại");
        if (!Objects.equals(current, supplied)) throw new ApiException(ErrorCode.VERSION_CONFLICT,
                "Dữ liệu đã thay đổi, vui lòng tải lại trước khi lưu");
    }

    private void validateImmutableCode(String current, String supplied) {
        if (!current.equals(supplied)) throw new ApiException(ErrorCode.BUSINESS_RULE, "ma", "Không thể thay đổi mã đã tạo");
    }

    private ApiException duplicateCode() {
        return new ApiException(ErrorCode.CONFLICT, "ma", "Mã đã tồn tại");
    }
}
