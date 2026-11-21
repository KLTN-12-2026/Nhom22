package com.do_an_tot_nghiep.k28.dictionary.service;

import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.dictionary.dto.DictionaryEntryResponse;
import com.do_an_tot_nghiep.k28.dictionary.dto.DictionaryLookupResponse;
import com.do_an_tot_nghiep.k28.dictionary.dto.DictionaryQuery;
import com.do_an_tot_nghiep.k28.dictionary.dto.DictionarySuggestionResponse;
import com.do_an_tot_nghiep.k28.dictionary.entity.TuDien;
import com.do_an_tot_nghiep.k28.dictionary.mapper.DictionaryMapper;
import com.do_an_tot_nghiep.k28.dictionary.repository.TuDienRepository;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DictionaryService {

    private static final int MAX_EXACT = 10;
    private static final int LOOKUP_SUGGESTIONS = 8;

    private final TuDienRepository repository;
    private final DictionaryMapper mapper;

    public List<DictionarySuggestionResponse> suggest(DictionaryQuery query) {
        String exact = DictionaryText.normalize(query.q());
        if (exact.isEmpty()) {
            return List.of();
        }
        return mapper.toSuggestions(repository.suggest(
                query.chieu(),
                DictionaryText.likePrefix(exact),
                exact,
                query.q(),
                PageRequest.of(0, query.limit())));
    }

    public List<DictionarySuggestionResponse> byMeaning(DictionaryQuery query) {
        String q = query.q().toLowerCase(Locale.ROOT);
        if (DictionaryText.normalize(q).isEmpty()) {
            return List.of();
        }
        String literal = q.replace("!", "!!").replace("%", "!%").replace("_", "!_");
        return mapper.toSuggestions(repository.byMeaning(
                q,
                literal + "%",
                "% " + literal + "%",
                literal + ",%",
                literal + ";%",
                query.limit()));
    }

    public DictionaryLookupResponse lookup(DictionaryQuery query) {
        String exact = DictionaryText.normalize(query.q());
        List<TuDien> found = exact.isEmpty()
                ? List.of()
                : repository.lookup(query.chieu(), exact, query.q(), PageRequest.of(0, MAX_EXACT));
        List<DictionarySuggestionResponse> related = exact.isEmpty()
                ? List.of()
                : mapper.toSuggestions(repository.suggest(
                        query.chieu(),
                        DictionaryText.likePrefix(exact),
                        exact,
                        query.q(),
                        PageRequest.of(0, LOOKUP_SUGGESTIONS + found.size())))
                .stream()
                .filter(s -> found.stream().noneMatch(f -> f.getId().toString().equals(s.id())))
                .limit(LOOKUP_SUGGESTIONS)
                .toList();
        return new DictionaryLookupResponse(query.q(), query.chieu(), mapper.toResponses(found), related);
    }

    public DictionaryEntryResponse get(Long id) {
        return repository.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy từ trong từ điển"));
    }
}
