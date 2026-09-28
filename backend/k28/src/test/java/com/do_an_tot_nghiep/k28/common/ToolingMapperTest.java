package com.do_an_tot_nghiep.k28.common;

import static org.assertj.core.api.Assertions.assertThat;

import lombok.Builder;
import lombok.Getter;
import org.junit.jupiter.api.Test;
import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

class ToolingMapperTest {

    @Getter
    @Builder
    static class Source {
        private final Long id;
        private final String tenHienThi;
    }

    record Target(String id, String tenHienThi) {}

    @Mapper
    interface SourceMapper {
        Target toTarget(Source source);
    }

    @Test
    void mapstructReadsLombokGetters() {
        Source source = Source.builder().id(7L).tenHienThi("Gia Phó").build();

        Target target = Mappers.getMapper(SourceMapper.class).toTarget(source);

        assertThat(target).isEqualTo(new Target("7", "Gia Phó"));
    }
}
