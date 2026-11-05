package com.do_an_tot_nghiep.k28.content.service;

import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import com.do_an_tot_nghiep.k28.content.dto.CreateTagRequest;
import com.do_an_tot_nghiep.k28.content.dto.TagResponse;
import com.do_an_tot_nghiep.k28.content.dto.UpdateTagRequest;
import com.do_an_tot_nghiep.k28.content.entity.Nhan;
import com.do_an_tot_nghiep.k28.content.mapper.CatalogMapper;
import com.do_an_tot_nghiep.k28.content.repository.NhanRepository;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TagService {
    private final NhanRepository tags;
    private final CatalogMapper mapper;

    public PageResponse<TagResponse> list(int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    "page phải không âm, size từ 1 đến 100"
            );
        }
        return PageResponse.of(tags
                .findAllByOrderByTenAscIdAsc(PageRequest.of(page, size))
                .map(mapper::toResponse));
    }

    @PreAuthorize("hasRole('ADMIN')")
    public TagResponse get(Long id) {
        return mapper.toResponse(tagOf(id));
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public TagResponse create(CreateTagRequest request) {
        if (tags.existsByTen(request.ten())) {
            throw duplicateName();
        }
        Nhan tag = Nhan.create(request.ten());
        return mapper.toResponse(tags.saveAndFlush(tag));
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public TagResponse update(Long id, UpdateTagRequest request) {
        Nhan tag = tagOf(id);
        if (!Objects.equals(tag.getVersion(), request.version())) {
            throw new ApiException(
                    ErrorCode.VERSION_CONFLICT,
                    "Nhãn đã thay đổi, vui lòng tải lại"
            );
        }
        if (tags.existsByTenAndIdNot(request.ten(), id)) {
            throw duplicateName();
        }
        tag.rename(request.ten());
        return mapper.toResponse(tags.saveAndFlush(tag));
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(Long id) {
        Nhan tag = tagOf(id);
        if (tags.countReferences(id) > 0) {
            throw new ApiException(
                    ErrorCode.CONFLICT,
                    "Nhãn đang được sử dụng, chưa thể xóa"
            );
        }
        tags.delete(tag);
        tags.flush();
    }

    private Nhan tagOf(Long id) {
        return tags.findById(id).orElseThrow(() ->
                new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy nhãn"));
    }

    private ApiException duplicateName() {
        return new ApiException(
                ErrorCode.CONFLICT, "ten", "Tên nhãn đã tồn tại"
        );
    }
}
