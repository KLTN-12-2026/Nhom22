package com.do_an_tot_nghiep.k28.notification.service;

import com.do_an_tot_nghiep.k28.admin.entity.enums.HanhDongQuanTri;
import com.do_an_tot_nghiep.k28.admin.entity.enums.LoaiDoiTuong;
import com.do_an_tot_nghiep.k28.admin.service.AuditService;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import com.do_an_tot_nghiep.k28.notification.dto.AnnouncementQuery;
import com.do_an_tot_nghiep.k28.notification.dto.AnnouncementResponse;
import com.do_an_tot_nghiep.k28.notification.dto.SystemAnnouncementRequest;
import com.do_an_tot_nghiep.k28.notification.dto.SystemAnnouncementResponse;
import com.do_an_tot_nghiep.k28.notification.entity.ThongBaoHeThong;
import com.do_an_tot_nghiep.k28.notification.mapper.AnnouncementMapper;
import com.do_an_tot_nghiep.k28.notification.repository.ThongBaoHeThongRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AnnouncementService {

    private static final int ACTIVE_LIMIT = 5;

    private final ThongBaoHeThongRepository announcements;
    private final AnnouncementMapper mapper;
    private final AuditService audit;
    private final Clock clock;

    @Transactional(readOnly = true)
    public List<AnnouncementResponse> active() {
        return announcements.findActive(clock.instant(), PageRequest.of(0, ACTIVE_LIMIT)).stream()
                .sorted(Comparator.comparingInt((ThongBaoHeThong t) -> -t.getMucDo().ordinal()))
                .map(mapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<SystemAnnouncementResponse> page(AnnouncementQuery query) {
        return PageResponse.of(announcements.findAllByOrderByBatDauAtDescIdDesc(
                PageRequest.of(query.page(), query.size())).map(mapper::toAdminResponse));
    }

    @Transactional
    public SystemAnnouncementResponse create(Long actorId, SystemAnnouncementRequest request) {
        validateWindow(request.batDauAt(), request.ketThucAt());
        ThongBaoHeThong thongBao = announcements.saveAndFlush(ThongBaoHeThong.create(actorId,
                request.tieuDe().strip(), request.noiDung().strip(), request.mucDo(), blankToNull(request.lienKet()),
                request.batDauAt(), request.ketThucAt(), request.hienThi()));
        audit.record(actorId, HanhDongQuanTri.TAO_THONG_BAO, LoaiDoiTuong.THONG_BAO_HE_THONG, thongBao.getId(),
                thongBao.getTieuDe(), null, null, fields(thongBao));
        return mapper.toAdminResponse(thongBao);
    }

    @Transactional
    public SystemAnnouncementResponse update(Long actorId, Long id, SystemAnnouncementRequest request) {
        if (request.version() == null) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "version", "Thiếu version");
        }
        ThongBaoHeThong thongBao = load(id);
        if (!Objects.equals(thongBao.getVersion(), request.version())) {
            throw new ApiException(ErrorCode.VERSION_CONFLICT, "Thông báo đã được sửa ở nơi khác, vui lòng tải lại");
        }
        validateWindow(request.batDauAt(), request.ketThucAt());
        Map<String, Object> truoc = fields(thongBao);
        thongBao.update(request.tieuDe().strip(), request.noiDung().strip(), request.mucDo(),
                blankToNull(request.lienKet()), request.batDauAt(), request.ketThucAt(), request.hienThi());
        Map<String, Object> sau = fields(thongBao);
        truoc.keySet().removeIf(key -> Objects.equals(truoc.get(key), sau.get(key)));
        sau.keySet().retainAll(truoc.keySet());
        if (!truoc.isEmpty()) {
            announcements.saveAndFlush(thongBao);
            audit.record(actorId, HanhDongQuanTri.SUA_THONG_BAO, LoaiDoiTuong.THONG_BAO_HE_THONG, thongBao.getId(),
                    thongBao.getTieuDe(), null, truoc, sau);
        }
        return mapper.toAdminResponse(thongBao);
    }

    @Transactional
    public void delete(Long actorId, Long id) {
        ThongBaoHeThong thongBao = load(id);
        Map<String, Object> truoc = fields(thongBao);
        announcements.delete(thongBao);
        audit.record(actorId, HanhDongQuanTri.XOA_THONG_BAO, LoaiDoiTuong.THONG_BAO_HE_THONG, id,
                thongBao.getTieuDe(), null, truoc, null);
    }

    private ThongBaoHeThong load(Long id) {
        return announcements.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy thông báo"));
    }

    private static void validateWindow(Instant batDauAt, Instant ketThucAt) {
        if (ketThucAt != null && !ketThucAt.isAfter(batDauAt)) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "ketThucAt",
                    "Thời điểm kết thúc phải sau thời điểm bắt đầu");
        }
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }

    private static Map<String, Object> fields(ThongBaoHeThong thongBao) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("tieuDe", thongBao.getTieuDe());
        map.put("noiDung", thongBao.getNoiDung());
        map.put("mucDo", thongBao.getMucDo().name());
        map.put("lienKet", thongBao.getLienKet());
        map.put("batDauAt", thongBao.getBatDauAt().toString());
        map.put("ketThucAt", thongBao.getKetThucAt() == null ? null : thongBao.getKetThucAt().toString());
        map.put("hienThi", thongBao.isHienThi());
        return map;
    }
}
