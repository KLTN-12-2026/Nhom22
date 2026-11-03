package com.do_an_tot_nghiep.k28.content;

import com.do_an_tot_nghiep.k28.content.dto.CreateCardRequest;
import com.do_an_tot_nghiep.k28.content.service.CardText;
import jakarta.validation.Validation;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

class CardTextTest {

    @ParameterizedTest
    @ValueSource(strings = {"\u00A0", "\u2007", "\u202F", " \t\n\u00A0\u202F "})
    void unicodeWhitespaceCannotBecomeRequiredMeaning(String whitespace) {
        CreateCardRequest request = new CreateCardRequest(
                "apple", null, whitespace, null, null, null,
                null, null, List.of(), null, null, null
        );

        try (var factory = Validation.buildDefaultValidatorFactory()) {
            assertThat(factory.getValidator().validate(request))
                    .anySatisfy(violation -> assertThat(
                            violation.getPropertyPath().toString()
                    ).isEqualTo("nghiaVi"));
        }

        assertThat(CardText.nullable(CardText.text(whitespace))).isNull();
    }

    @Test
    void trimsUnicodeEdgesWithoutChangingExampleFormatting() {
        assertThat(CardText.text("\u00A0Cafe\u0301  au\n lait\u202F"))
                .isEqualTo("Caf\u00E9  au\n lait");
        assertThat(CardText.text(null)).isNull();
    }

    @Test
    void duplicateComparisonNormalizesCaseSpacingAndCanonicalUnicode() {
        assertThat(CardText.duplicateKey("\u00A0CAFE\u0301\t AU\u202F", " Noun "))
                .isEqualTo(CardText.duplicateKey("caf\u00E9 au", "noun"));
        assertThat(CardText.duplicateKey("apple", null))
                .isEqualTo(CardText.duplicateKey(" APPLE ", "\u00A0"));
        assertThat(CardText.duplicateKey("cafe", "noun"))
                .isNotEqualTo(CardText.duplicateKey("caf\u00E9", "noun"));
    }
}
