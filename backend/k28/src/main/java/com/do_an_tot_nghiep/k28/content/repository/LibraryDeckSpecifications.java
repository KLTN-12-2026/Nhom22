package com.do_an_tot_nghiep.k28.content.repository;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.entity.enums.MucTieu;
import com.do_an_tot_nghiep.k28.account.entity.enums.TrangThaiNguoiDung;
import com.do_an_tot_nghiep.k28.account.service.AccountAdminService;
import com.do_an_tot_nghiep.k28.account.entity.enums.TrinhDo;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.content.entity.BoThe;
import com.do_an_tot_nghiep.k28.content.entity.BoYeuThich;
import com.do_an_tot_nghiep.k28.content.entity.TheTuVung;
import com.do_an_tot_nghiep.k28.content.entity.enums.NguonBo;
import com.do_an_tot_nghiep.k28.content.entity.enums.QuyenTruyCap;
import com.do_an_tot_nghiep.k28.content.entity.enums.TrangThaiKiemDuyet;
import com.do_an_tot_nghiep.k28.learning.entity.TienDoThe;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Order;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

import java.text.Normalizer;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

public final class LibraryDeckSpecifications {

    private LibraryDeckSpecifications() {
    }

    public static Specification<BoThe> publiclyVisible() {
        return (root, query, cb) -> cb.and(
                cb.isNull(root.get("xoaAt")),
                activeOwner(root, query, cb),
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

    private static Predicate activeOwner(Root<BoThe> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
        Subquery<Long> owner = query.subquery(Long.class);
        Root<NguoiDung> user = owner.from(NguoiDung.class);
        owner.select(user.get("id")).where(
                cb.equal(user.get("id"), root.get("chuSoHuuId")),
                cb.equal(user.get("trangThai"), TrangThaiNguoiDung.BI_KHOA),
                cb.notEqual(user.get("email"), AccountAdminService.SYSTEM_EMAIL)
        );
        return cb.not(cb.exists(owner));
    }

    public static Specification<BoThe> matching(
            String q,
            Long chuDeId,
            TrinhDo trinhDo,
            MucTieu mucTieu,
            NguonBo nguon,
            Long chuSoHuuId
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

            if (chuSoHuuId != null) {
                predicates.add(cb.equal(
                        root.get("chuSoHuuId"), chuSoHuuId
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

    public static Specification<BoThe> forYou(Long userId, Collection<Long> topicIds, TrinhDo trinhDo) {
        return publiclyVisible().and((root, query, cb) -> {
            Subquery<Long> copied = query.subquery(Long.class);
            Root<BoThe> copy = copied.from(BoThe.class);
            copied.select(copy.get("id")).where(
                    cb.equal(copy.get("boNguonId"), root.get("id")),
                    cb.equal(copy.get("chuSoHuuId"), userId),
                    cb.isNull(copy.get("xoaAt"))
            );

            Subquery<Long> learned = query.subquery(Long.class);
            Root<TienDoThe> progress = learned.from(TienDoThe.class);
            Root<TheTuVung> card = learned.from(TheTuVung.class);
            learned.select(progress.get("id")).where(
                    cb.equal(progress.get("theId"), card.get("id")),
                    cb.equal(card.get("boTheId"), root.get("id")),
                    cb.equal(progress.get("nguoiDungId"), userId)
            );

            if (query.getResultType() != null && !Long.class.equals(query.getResultType())) {
                List<Order> orders = new ArrayList<>();
                if (trinhDo != null) {
                    orders.add(cb.asc(cb.selectCase()
                            .when(cb.equal(root.get("trinhDo"), trinhDo), 0)
                            .otherwise(1)));
                }
                orders.add(cb.desc(favoriteCount(root, query, cb, null)));
                orders.add(cb.desc(root.get("updatedAt")));
                orders.add(cb.desc(root.get("id")));
                query.orderBy(orders);
            }

            return cb.and(
                    root.get("chuDeId").in(topicIds),
                    cb.notEqual(root.get("chuSoHuuId"), userId),
                    cb.not(cb.exists(copied)),
                    cb.not(cb.exists(learned))
            );
        });
    }

    public static Specification<BoThe> visibleById(Long id) {
        return publiclyVisible().and(
                (root, query, cb) -> cb.equal(root.get("id"), id)
        );
    }

    public static Specification<BoThe> ordered(String sort, Instant trendingSince) {
        return (root, query, cb) -> {
            if (query == null || Long.class.equals(query.getResultType())) {
                return cb.conjunction();
            }

            switch (sort) {
                case "updated" -> query.orderBy(
                        cb.desc(root.get("updatedAt")),
                        cb.desc(root.get("id"))
                );

                case "newest" -> query.orderBy(
                        cb.desc(root.get("createdAt")),
                        cb.desc(root.get("id"))
                );

                case "favorites" -> query.orderBy(
                        cb.desc(favoriteCount(root, query, cb, null)),
                        cb.desc(root.get("updatedAt")),
                        cb.desc(root.get("id"))
                );

                case "trending" -> query.orderBy(
                        cb.desc(cb.sum(
                                favoriteCount(root, query, cb, trendingSince),
                                copyCount(root, query, cb, trendingSince)
                        )),
                        cb.desc(favoriteCount(root, query, cb, null)),
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
                        "Sắp xếp phải là updated, name, size, trending, favorites hoặc newest"
                );
            }

            return cb.conjunction();
        };
    }

    private static Subquery<Long> favoriteCount(
            Root<BoThe> root,
            CriteriaQuery<?> query,
            CriteriaBuilder cb,
            Instant since
    ) {
        Subquery<Long> count = query.subquery(Long.class);
        Root<BoYeuThich> favorite = count.from(BoYeuThich.class);
        List<Predicate> where = new ArrayList<>();
        where.add(cb.equal(favorite.get("boTheId"), root.get("id")));
        where.add(cb.notEqual(favorite.get("nguoiDungId"), root.get("chuSoHuuId")));
        if (since != null) {
            where.add(cb.greaterThanOrEqualTo(favorite.<Instant>get("createdAt"), since));
        }
        return count.select(cb.count(favorite)).where(where.toArray(Predicate[]::new));
    }

    private static Subquery<Long> copyCount(
            Root<BoThe> root,
            CriteriaQuery<?> query,
            CriteriaBuilder cb,
            Instant since
    ) {
        Subquery<Long> count = query.subquery(Long.class);
        Root<BoThe> copy = count.from(BoThe.class);
        return count.select(cb.count(copy)).where(
                cb.equal(copy.get("boNguonId"), root.get("id")),
                cb.notEqual(copy.get("chuSoHuuId"), root.get("chuSoHuuId")),
                cb.greaterThanOrEqualTo(copy.<Instant>get("createdAt"), since)
        );
    }

    public static Specification<BoThe> ownedMatching(Long ownerId, String q) {
        String pattern = searchPattern(q);

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isNull(root.get("xoaAt")));
            predicates.add(cb.equal(root.get("chuSoHuuId"), ownerId));

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

            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    public static String escapeLike(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String normalized = Normalizer.normalize(
                value.strip(),
                Normalizer.Form.NFC
        );

        return normalized
                .replace("!", "!!")
                .replace("%", "!%")
                .replace("_", "!_");
    }

    private static String searchPattern(String value) {
        String escaped = escapeLike(value);
        return escaped == null ? null : "%" + escaped + "%";
    }
}