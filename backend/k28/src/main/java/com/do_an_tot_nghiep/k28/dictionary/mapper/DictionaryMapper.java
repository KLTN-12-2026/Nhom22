package com.do_an_tot_nghiep.k28.dictionary.mapper;

import com.do_an_tot_nghiep.k28.dictionary.dto.DictionaryEntryResponse;
import com.do_an_tot_nghiep.k28.dictionary.dto.DictionarySuggestionResponse;
import com.do_an_tot_nghiep.k28.dictionary.entity.TuDien;
import com.do_an_tot_nghiep.k28.dictionary.repository.TuDienRepository;
import java.util.List;
import org.mapstruct.Mapper;

@Mapper
public interface DictionaryMapper {

    DictionaryEntryResponse toResponse(TuDien entry);

    List<DictionaryEntryResponse> toResponses(List<TuDien> entries);

    DictionarySuggestionResponse toSuggestion(TuDienRepository.Headword headword);

    List<DictionarySuggestionResponse> toSuggestions(List<TuDienRepository.Headword> headwords);
}
