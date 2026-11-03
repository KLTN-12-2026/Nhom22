package com.do_an_tot_nghiep.k28.content.repository;

import com.do_an_tot_nghiep.k28.account.entity.enums.MucTieu;
import com.do_an_tot_nghiep.k28.account.entity.enums.TrinhDo;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.content.entity.BoThe;
import com.do_an_tot_nghiep.k28.content.entity.TheTuVung;
import com.do_an_tot_nghiep.k28.content.entity.enums.NguonBo;
import com.do_an_tot_nghiep.k28.content.entity.enums.QuyenTruyCap;
import com.do_an_tot_nghiep.k28.content.entity.enums.TrangThaiKiemDuyet;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;

public final class LibraryDeckSpecifications {

    private LibraryDeckSpecifications() {
    }

    public static Specification<BoThe> publiclyVisible() {
        return (root, query, cb) -> cb.and(
                cb.isNull(root.get("xoaAt")),
                cb.equal(
                        root.get("quyenTruyCap"),
                        QuyenTruyCap.CONG_KHAI
                ),
                cb.equal(
                        root.get("trangThaiKiemDuyet"),
                        TrangThaiKiemDuyet.BINH_THUONG
                )
        );
    }

    public static Specification<BoThe> matching(
            String q,
            Long chuDeId,
            TrinhDo trinhDo,
            MucTieu mucTieu,
            NguonBo nguon
    ) {
        String pattern = searchPattern(q);

        return publiclyVisible().and((root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (pattern != null) {
                predicates.add(cb.or(
                        cb.like(
                                cb.lower(root.<String>get("ten")),
                                cb.lower(cb.literal(pattern)),
                                '!'
                        ),
                        cb.like(
                                cb.lower(root.<String>get("moTa")),
                                cb.lower(cb.literal(pattern)),
                                '!'
                        )
                ));
            }

            if (chuDeId != null) {
                predicates.add(cb.equal(
                        root.get("chuDeId"), chuDeId
                ));
            }

            if (trinhDo != null) {
                predicates.add(cb.equal(
                        root.get("trinhDo"), trinhDo
                ));
            }

            if (mucTieu != null) {
                predicates.add(cb.equal(
                        root.get("mucTieu"), mucTieu
                ));
            }

            if (nguon != null) {
                predicates.add(cb.equal(
                        root.get("boMau"),
                        nguon == NguonBo.MAU
                ));
            }

            return cb.and(predicates.toArray(Predicate[]::new));
        });
    }

    public static Specification<BoThe> visibleById(Long id) {
        return publiclyVisible().and(
                (root, query, cb) -> cb.equal(root.get("id"), id)
        );
    }

    public static Specification<BoThe> ordered(String sort) {
        return (root, query, cb) -> {
            if (query == null || Long.class.equals(query.getResultType())) {
                return cb.conjunction();
            }

            switch (sort) {
                case "updated" -> query.orderBy(
                        cb.desc(root.get("updatedAt")),
                        cb.desc(root.get("id"))
                );

                case "name" -> query.orderBy(
                        cb.asc(root.get("ten")),
                        cb.asc(root.get("id"))
                );

                case "size" -> {
                    Subquery<Long> cardCount = query.subquery(Long.class);
                    Root<BoThe> deck = cardCount.correlate(root);
                    Root<TheTuVung> card = cardCount.from(TheTuVung.class);

                    cardCount.select(cb.count(card.get("id")));
                    cardCount.where(
                            cb.equal(
                                    card.get("boTheId"),
                                    deck.get("id")
                            ),
                            cb.isNull(card.get("xoaAt"))
                    );

                    query.orderBy(
                            cb.desc(cardCount),
                            cb.desc(root.get("id"))
                    );
                }

                default -> throw new ApiException(
                        ErrorCode.VALIDATION_FAILED,
                        "sort",
                        "Sắp xếp phải là updated, name hoặc size"
                );
            }

            return cb.conjunction();
        };
    }

    private static String searchPattern(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String normalized = Normalizer.normalize(
                value.strip(),
                Normalizer.Form.NFC
        );

        String escaped = normalized
                .replace("!", "!!")
                .replace("%", "!%")
                .replace("_", "!_");

        return "%" + escaped + "%";
    }
}