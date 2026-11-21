package com.do_an_tot_nghiep.k28.content.service;

import com.do_an_tot_nghiep.k28.common.realtime.LoaiSuKien;
import com.do_an_tot_nghiep.k28.common.realtime.RealtimeService;
import com.do_an_tot_nghiep.k28.account.service.AccountService;
import com.do_an_tot_nghiep.k28.admin.entity.enums.HanhDongQuanTri;
import com.do_an_tot_nghiep.k28.admin.entity.enums.LoaiDoiTuong;
import com.do_an_tot_nghiep.k28.admin.service.AuditService;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import com.do_an_tot_nghiep.k28.content.dto.DeckPublishStatusResponse;
import com.do_an_tot_nghiep.k28.content.dto.LibraryCardResponse;
import com.do_an_tot_nghiep.k28.content.dto.PublishDecisionRequest;
import com.do_an_tot_nghiep.k28.content.dto.PublishRequestQuery;
import com.do_an_tot_nghiep.k28.content.dto.PublishRequestResponse;
import com.do_an_tot_nghiep.k28.content.entity.BoThe;
import com.do_an_tot_nghiep.k28.content.entity.YeuCauCongKhai;
import com.do_an_tot_nghiep.k28.content.entity.enums.NguoiDuyetCongKhai;
import com.do_an_tot_nghiep.k28.content.entity.enums.QuyenTruyCap;
import com.do_an_tot_nghiep.k28.content.entity.enums.QuyetDinhCongKhai;
import com.do_an_tot_nghiep.k28.content.entity.enums.TrangThaiKiemDuyet;
import com.do_an_tot_nghiep.k28.content.entity.enums.TrangThaiYeuCauCongKhai;
import com.do_an_tot_nghiep.k28.content.mapper.PublishRequestMapper;
import com.do_an_tot_nghiep.k28.content.repository.BoTheRepository;
import com.do_an_tot_nghiep.k28.content.repository.TheTuVungRepository;
import com.do_an_tot_nghiep.k28.content.repository.YeuCauCongKhaiRepository;
import com.do_an_tot_nghiep.k28.notification.entity.enums.LoaiThongBao;
import com.do_an_tot_nghiep.k28.notification.service.NotificationService;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class PublishRequestService {

    static final Duration PENDING_TTL = Duration.ofDays(14);
    private static final String REVIEW_LINK = "/yeu-cau-cong-khai";
    private static final String DECK_LINK = "/bo-the/";

    private final BoTheRepository decks;
    private final YeuCauCongKhaiRepository requests;
    private final CopyInfoService copyInfo;
    private final LibraryService library;
    private final TheTuVungRepository cards;
    private final PublishRequestMapper mapper;
    private final AccountService accounts;
    private final NotificationService notifications;
    private final AuditService audit;
    private final Clock clock;
    private final RealtimeService realtime;

    public DeckPublishStatusResponse submit(Long userId, Long deckId, String loiNhan) {
        Instant now = clock.instant();
        BoThe copy = decks.findOwnedForUpdate(deckId, userId).orElseThrow(this::deckNotFound);
        if (copy.getBoNguonId() == null) {
            throw rule("Bộ của bạn không phải bản sao, hãy đổi quyền truy cập trực tiếp", "KHONG_PHAI_BAN_SAO");
        }
        if (copy.getQuyenTruyCap() == QuyenTruyCap.CONG_KHAI) {
            throw rule("Bản sao đã được công khai", "DA_CONG_KHAI");
        }
        if (copy.getTrangThaiKiemDuyet() != TrangThaiKiemDuyet.BINH_THUONG) {
            throw rule("Bản sao đang bị ẩn do kiểm duyệt", "DA_AN");
        }
        BoThe source = decks.findById(copy.getBoNguonId()).orElseThrow(this::deckNotFound);
        if (source.isCaoCap()) {
            throw rule("Bản sao của bộ mẫu cao cấp không được công khai", "BO_CAO_CAP");
        }

        var latest = requests.findFirstByBoTheIdOrderByIdDesc(copy.getId()).orElse(null);
        if (latest != null && latest.isOverdue(now)) {
            expire(latest, now);
        }
        if (latest != null && latest.isPending()) {
            throw new ApiException(ErrorCode.CONFLICT, "Bản sao đang có yêu cầu chờ duyệt",
                    Map.of("yeuCauId", latest.getId().toString()));
        }
        Instant resubmitAt = latest == null ? null : CopyInfoService.resubmitAt(latest);
        if (resubmitAt != null && resubmitAt.isAfter(now)) {
            throw new ApiException(ErrorCode.BUSINESS_RULE, "Bạn cần chờ 24 giờ sau lần bị từ chối hoặc thu hồi",
                    Map.of("lyDo", "CHO_GUI_LAI", "guiLaiSauAt", resubmitAt.toString()));
        }

        NguoiDuyetCongKhai approver = approver(source);
        YeuCauCongKhai request = YeuCauCongKhai.create(copy, userId, approver, loiNhan, now.plus(PENDING_TTL));
        boolean selfApproved = copyInfo.selfPublishable(copy, source);
        if (selfApproved) {
            request.resolve(TrangThaiYeuCauCongKhai.DA_DUYET, userId, null, now);
            setVisibility(copy, QuyenTruyCap.CONG_KHAI);
        }
        try {
            request = requests.saveAndFlush(request);
        } catch (DataIntegrityViolationException e) {
            throw new ApiException(ErrorCode.CONFLICT, "Bản sao đang có yêu cầu chờ duyệt");
        }
        if (!selfApproved && approver == NguoiDuyetCongKhai.TAC_GIA) {
            notifications.create(source.getChuSoHuuId(), LoaiThongBao.YEU_CAU_CONG_KHAI, null,
                    "Có yêu cầu công khai bản sao",
                    "Bản sao \"" + copy.getTen() + "\" của bộ \"" + source.getTen() + "\" đang chờ bạn duyệt.",
                    REVIEW_LINK, true, false);
        }
        realtime.toAdmins(LoaiSuKien.HANG_CHO_QUAN_TRI);
        return copyInfo.status(request);
    }

    public DeckPublishStatusResponse withdraw(Long userId, Long requestId) {
        YeuCauCongKhai request = requests.findForUpdate(requestId)
                .filter(found -> found.getNguoiGuiId().equals(userId))
                .orElseThrow(this::requestNotFound);
        Instant now = clock.instant();
        if (request.isOverdue(now)) {
            expire(request, now);
        }
        if (!request.isPending()) {
            throw new ApiException(ErrorCode.CONFLICT, "Yêu cầu đã được xử lý");
        }
        request.resolve(TrangThaiYeuCauCongKhai.DA_RUT, userId, null, now);
        realtime.toAdmins(LoaiSuKien.HANG_CHO_QUAN_TRI);
        requests.flush();
        return copyInfo.status(request);
    }

    public PageResponse<PublishRequestResponse> inbox(Long userId, PublishRequestQuery query) {
        expireOverdue();
        return page(requests.findForAuthor(userId, query.trangThai(), PageRequest.of(query.page(), query.size())));
    }

    public PageResponse<PublishRequestResponse> adminQueue(PublishRequestQuery query) {
        expireOverdue();
        return page(requests.findForAdmin(query.trangThai(), PageRequest.of(query.page(), query.size())));
    }

    @Transactional(readOnly = true)
    public PageResponse<LibraryCardResponse> previewCards(Long actorId, Long requestId, boolean asAdmin,
                                                          int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "page phải không âm, size từ 1 đến 100");
        }
        YeuCauCongKhai request = requests.findById(requestId).orElseThrow(this::requestNotFound);
        requireReviewer(actorId, request, asAdmin);
        return library.cardResponses(cards.findByBoTheIdAndXoaAtIsNullOrderByIdAsc(
                request.getBoTheId(), PageRequest.of(page, size)));
    }

    public PublishRequestResponse decide(Long actorId, Long requestId, PublishDecisionRequest body, boolean asAdmin) {
        YeuCauCongKhai request = requests.findForUpdate(requestId).orElseThrow(this::requestNotFound);
        BoThe source = requireReviewer(actorId, request, asAdmin);
        Instant now = clock.instant();
        if (request.isOverdue(now)) {
            expire(request, now);
        }
        if (!Objects.equals(request.getVersion(), body.version())) {
            throw new ApiException(ErrorCode.VERSION_CONFLICT, "Yêu cầu đã thay đổi, vui lòng tải lại");
        }

        BoThe copy = decks.findForUpdate(request.getBoTheId()).orElseThrow(this::requestNotFound);
        TrangThaiYeuCauCongKhai before = request.getTrangThai();
        QuyetDinhCongKhai decision = body.quyetDinh();
        switch (decision) {
            case DUYET -> {
                requirePending(request);
                if (copy.getXoaAt() != null || copy.getTrangThaiKiemDuyet() != TrangThaiKiemDuyet.BINH_THUONG) {
                    throw rule("Bản sao đã bị xóa hoặc đang bị ẩn", "BAN_SAO_KHONG_HOP_LE");
                }
                if (source.isCaoCap()) {
                    throw rule("Bản sao của bộ mẫu cao cấp không được công khai", "BO_CAO_CAP");
                }
                request.resolve(TrangThaiYeuCauCongKhai.DA_DUYET, actorId, body.lyDo(), now);
                setVisibility(copy, QuyenTruyCap.CONG_KHAI);
            }
            case TU_CHOI -> {
                requirePending(request);
                request.resolve(TrangThaiYeuCauCongKhai.TU_CHOI, actorId, body.lyDo(), now);
            }
            case THU_HOI -> {
                boolean latest = requests.findFirstByBoTheIdOrderByIdDesc(copy.getId())
                        .map(found -> found.getId().equals(request.getId())).orElse(false);
                if (request.getTrangThai() != TrangThaiYeuCauCongKhai.DA_DUYET || !latest) {
                    throw new ApiException(ErrorCode.CONFLICT, "Chỉ thu hồi được yêu cầu đã duyệt gần nhất");
                }
                request.resolve(TrangThaiYeuCauCongKhai.THU_HOI, actorId, body.lyDo(), now);
                if (copy.getXoaAt() == null) {
                    setVisibility(copy, QuyenTruyCap.RIENG_TU);
                }
            }
        }
        requests.flush();
        notifyResult(request, copy);
        if (asAdmin) {
            Map<String, Object> after = new LinkedHashMap<>();
            after.put("trangThai", request.getTrangThai().name());
            after.put("quyenTruyCap", copy.getQuyenTruyCap().name());
            audit.record(actorId, auditAction(decision), LoaiDoiTuong.BO_THE, copy.getId(), copy.getTen(),
                    body.lyDo(), Map.of("trangThai", before.name()), after);
        }
        realtime.toAdmins(LoaiSuKien.HANG_CHO_QUAN_TRI);
        return responses(List.of(request)).getFirst();
    }

    public int expireOverdue() {
        Instant now = clock.instant();
        List<Long> ids = requests.findOverdueIds(now, PageRequest.of(0, 200));
        int expired = 0;
        for (Long id : ids) {
            YeuCauCongKhai request = requests.findForUpdate(id).orElse(null);
            if (request != null && request.isOverdue(now)) {
                expire(request, now);
                expired++;
            }
        }
        return expired;
    }

    private void expire(YeuCauCongKhai request, Instant now) {
        request.resolve(TrangThaiYeuCauCongKhai.HET_HAN, null, null, now);
        realtime.toAdmins(LoaiSuKien.HANG_CHO_QUAN_TRI);
        requests.flush();
        decks.findById(request.getBoTheId()).ifPresent(copy -> notifyResult(request, copy));
    }

    private BoThe requireReviewer(Long actorId, YeuCauCongKhai request, boolean asAdmin) {
        BoThe source = decks.findById(request.getBoNguonId()).orElseThrow(this::requestNotFound);
        boolean adminCase = approver(source) == NguoiDuyetCongKhai.ADMIN;
        boolean allowed = asAdmin ? adminCase : !adminCase && actorId.equals(source.getChuSoHuuId());
        if (!allowed) {
            throw requestNotFound();
        }
        return source;
    }

    private NguoiDuyetCongKhai approver(BoThe source) {
        return copyInfo.approver(source);
    }

    private void setVisibility(BoThe copy, QuyenTruyCap quyenTruyCap) {
        copy.updateDetails(copy.getChuDeId(), copy.getTen(), copy.getMoTa(), copy.getTrinhDo(), quyenTruyCap);
        decks.flush();
    }

    private void notifyResult(YeuCauCongKhai request, BoThe copy) {
        String noiDung = switch (request.getTrangThai()) {
            case DA_DUYET -> "Bản sao \"" + copy.getTen() + "\" đã được duyệt và đang công khai.";
            case TU_CHOI -> "Yêu cầu công khai \"" + copy.getTen() + "\" bị từ chối: " + request.getLyDo();
            case THU_HOI -> "Bản sao \"" + copy.getTen() + "\" bị thu hồi công khai: " + request.getLyDo();
            case HET_HAN -> "Yêu cầu công khai \"" + copy.getTen() + "\" đã hết hạn vì chưa được duyệt.";
            default -> null;
        };
        if (noiDung != null) {
            notifications.create(request.getNguoiGuiId(), LoaiThongBao.KET_QUA_CONG_KHAI, null,
                    "Kết quả yêu cầu công khai", noiDung, DECK_LINK + copy.getId(), true, false);
        }
    }

    private PageResponse<PublishRequestResponse> page(Page<YeuCauCongKhai> result) {
        Function<YeuCauCongKhai, PublishRequestResponse> responder = responder(result.getContent());
        return PageResponse.of(result.map(responder));
    }

    private List<PublishRequestResponse> responses(List<YeuCauCongKhai> content) {
        return content.stream().map(responder(content)).toList();
    }

    private Function<YeuCauCongKhai, PublishRequestResponse> responder(List<YeuCauCongKhai> content) {
        Set<Long> deckIds = content.stream()
                .flatMap(request -> Stream.of(request.getBoTheId(), request.getBoNguonId()))
                .collect(Collectors.toSet());
        Map<Long, String> names = decks.findAllById(deckIds).stream()
                .collect(Collectors.toMap(BoThe::getId, BoThe::getTen));
        Map<Long, String> senders = accounts.publicDisplayNames(
                content.stream().map(YeuCauCongKhai::getNguoiGuiId).distinct().toList());
        return request -> mapper.toResponse(request, names.get(request.getBoTheId()),
                names.get(request.getBoNguonId()), senders.get(request.getNguoiGuiId()));
    }

    private void requirePending(YeuCauCongKhai request) {
        if (!request.isPending()) {
            throw new ApiException(ErrorCode.CONFLICT, "Yêu cầu đã được xử lý");
        }
    }

    private HanhDongQuanTri auditAction(QuyetDinhCongKhai decision) {
        return switch (decision) {
            case DUYET -> HanhDongQuanTri.DUYET_CONG_KHAI;
            case TU_CHOI -> HanhDongQuanTri.TU_CHOI_CONG_KHAI;
            case THU_HOI -> HanhDongQuanTri.THU_HOI_CONG_KHAI;
        };
    }

    private ApiException rule(String message, String lyDo) {
        return new ApiException(ErrorCode.BUSINESS_RULE, message, Map.of("lyDo", lyDo));
    }

    private ApiException deckNotFound() {
        return new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy bộ thẻ");
    }

    private ApiException requestNotFound() {
        return new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy yêu cầu công khai");
    }
}
