package com.do_an_tot_nghiep.k28.content.service;

import com.do_an_tot_nghiep.k28.account.service.AccountService;
import com.do_an_tot_nghiep.k28.content.dto.BanSaoResponse;
import com.do_an_tot_nghiep.k28.content.dto.DeckPublishStatusResponse;
import com.do_an_tot_nghiep.k28.content.entity.BoThe;
import com.do_an_tot_nghiep.k28.content.entity.YeuCauCongKhai;
import com.do_an_tot_nghiep.k28.content.entity.enums.NguoiDuyetCongKhai;
import com.do_an_tot_nghiep.k28.content.entity.enums.TrangThaiKiemDuyet;
import com.do_an_tot_nghiep.k28.content.entity.enums.TrangThaiYeuCauCongKhai;
import com.do_an_tot_nghiep.k28.content.mapper.PublishRequestMapper;
import com.do_an_tot_nghiep.k28.content.repository.BoTheRepository;
import com.do_an_tot_nghiep.k28.content.repository.YeuCauCongKhaiRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CopyInfoService {

    static final Duration RESUBMIT_DELAY = Duration.ofHours(24);

    private final BoTheRepository decks;
    private final YeuCauCongKhaiRepository requests;
    private final AccountService accounts;
    private final PublishRequestMapper mapper;

    public Map<Long, BanSaoResponse> origins(Collection<BoThe> copies) {
        List<Long> sourceIds = copies.stream().map(BoThe::getBoNguonId).filter(Objects::nonNull).distinct().toList();
        if (sourceIds.isEmpty()) {
            return Map.of();
        }
        Map<Long, BoThe> sources = decks.findAllById(sourceIds).stream()
                .collect(Collectors.toMap(BoThe::getId, Function.identity()));
        Map<Long, String> authors = accounts.publicDisplayNames(
                sources.values().stream().map(BoThe::getChuSoHuuId).distinct().toList());
        Map<Long, BanSaoResponse> result = new HashMap<>();
        for (BoThe copy : copies) {
            if (copy.getBoNguonId() == null) {
                continue;
            }
            BoThe source = sources.get(copy.getBoNguonId());
            boolean visible = source != null && source.getXoaAt() == null && source.isPublished();
            result.put(copy.getId(), new BanSaoResponse(
                    copy.getBoNguonId().toString(),
                    visible ? source.getTen() : null,
                    visible ? authors.get(source.getChuSoHuuId()) : null,
                    visible,
                    source != null && selfPublishable(copy, source)
            ));
        }
        return result;
    }

    public NguoiDuyetCongKhai approver(BoThe source) {
        boolean authorCase = source.getXoaAt() == null
                && source.isPublished()
                && accounts.activeIds(List.of(source.getChuSoHuuId())).contains(source.getChuSoHuuId());
        return authorCase ? NguoiDuyetCongKhai.TAC_GIA : NguoiDuyetCongKhai.ADMIN;
    }

    public boolean selfPublishable(BoThe copy, BoThe source) {
        if (source.getTrangThaiKiemDuyet() != TrangThaiKiemDuyet.BINH_THUONG) {
            return false;
        }
        Long owner = copy.getChuSoHuuId();
        if (owner.equals(source.getChuSoHuuId())) {
            return true;
        }
        return approver(source) == NguoiDuyetCongKhai.ADMIN
                && accounts.adminIds(List.of(owner)).contains(owner);
    }

    public Map<Long, DeckPublishStatusResponse> statuses(Collection<BoThe> copies) {
        List<Long> ids = copies.stream().filter(deck -> deck.getBoNguonId() != null).map(BoThe::getId).toList();
        if (ids.isEmpty()) {
            return Map.of();
        }
        return requests.findLatest(ids).stream()
                .collect(Collectors.toMap(YeuCauCongKhai::getBoTheId, this::status));
    }

    DeckPublishStatusResponse status(YeuCauCongKhai request) {
        return mapper.toStatus(request, resubmitAt(request));
    }

    static Instant resubmitAt(YeuCauCongKhai request) {
        boolean delayed = request.getTrangThai() == TrangThaiYeuCauCongKhai.TU_CHOI
                || request.getTrangThai() == TrangThaiYeuCauCongKhai.THU_HOI;
        return delayed && request.getXuLyAt() != null ? request.getXuLyAt().plus(RESUBMIT_DELAY) : null;
    }
}
