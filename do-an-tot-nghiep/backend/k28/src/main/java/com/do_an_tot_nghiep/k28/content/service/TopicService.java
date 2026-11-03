package com.do_an_tot_nghiep.k28.content.service;

import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import com.do_an_tot_nghiep.k28.content.dto.CreateTopicRequest;
import com.do_an_tot_nghiep.k28.content.dto.TopicResponse;
import com.do_an_tot_nghiep.k28.content.dto.UpdateTopicRequest;
import com.do_an_tot_nghiep.k28.content.entity.ChuDe;
import com.do_an_tot_nghiep.k28.content.mapper.CatalogMapper;
import com.do_an_tot_nghiep.k28.content.repository.ChuDeRepository;

import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TopicService {
    private final ChuDeRepository topics;
    private final CatalogMapper mapper;

    public PageResponse<TopicResponse> list(int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    "page phải không âm, size từ 1 đến 100"
            );
        }
        return PageResponse.of(topics
                .findAllByOrderByTenAscIdAsc(PageRequest.of(page, size))
                .map(mapper::toResponse));
    }

    @PreAuthorize("hasRole('ADMIN')")
    public TopicResponse get(Long id) {
        return mapper.toResponse(topicOf(id));
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public TopicResponse create(CreateTopicRequest request) {
        if (topics.existsByTen(request.ten())) {
            throw duplicateName();
        }
        ChuDe topic = ChuDe.create(request.ten(), request.moTa());
        return mapper.toResponse(topics.saveAndFlush(topic));
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public TopicResponse update(Long id, UpdateTopicRequest request) {
        ChuDe topic = topicOf(id);
        if (!Objects.equals(topic.getVersion(), request.version())) {
            throw new ApiException(
                    ErrorCode.VERSION_CONFLICT,
                    "Chủ đề đã thay đổi, vui lòng tải lại"
            );
        }
        if (topics.existsByTenAndIdNot(request.ten(), id)) {
            throw duplicateName();
        }
        topic.rename(request.ten(), request.moTa());
        return mapper.toResponse(topics.saveAndFlush(topic));
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(Long id) {
        ChuDe topic = topicOf(id);
        if (topics.countReferences(id) > 0) {
            throw new ApiException(
                    ErrorCode.CONFLICT,
                    "Chủ đề đang được sử dụng, chưa thể xóa"
            );
        }
        topics.delete(topic);
        topics.flush();
    }

    public List<Long> validateSelectedTopics(List<String> topicIds) {
        if (topicIds == null || topicIds.size() > 5) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    "chuDeIds",
                    "Gửi danh sách tối đa 5 chủ đề"
            );
        }

        List<Long> ids;
        try {
            ids = topicIds.stream().map(value -> {
                if (value == null || !value.matches("[1-9][0-9]{0,18}")) {
                    throw new NumberFormatException();
                }
                return Long.valueOf(value);
            }).toList();
        } catch (NumberFormatException ex) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    "chuDeIds",
                    "ID chủ đề không hợp lệ"
            );
        }

        if (new HashSet<>(ids).size() != ids.size()) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    "chuDeIds",
                    "Danh sách chủ đề không được trùng"
            );
        }

        if (!ids.isEmpty() && topics.findAllById(ids).size() != ids.size()) {
            throw new ApiException(
                    ErrorCode.BUSINESS_RULE,
                    "chuDeIds",
                    "Có chủ đề không còn tồn tại, vui lòng chọn lại"
            );
        }

        return ids;
    }

    private ChuDe topicOf(Long id) {
        return topics.findById(id).orElseThrow(() ->
                new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy chủ đề"));
    }

    private ApiException duplicateName() {
        return new ApiException(
                ErrorCode.CONFLICT, "ten", "Tên chủ đề đã tồn tại"
        );
    }
}