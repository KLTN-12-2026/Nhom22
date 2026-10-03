package com.do_an_tot_nghiep.k28.content.entity;

import com.do_an_tot_nghiep.k28.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Nhan extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String ten;

    @Version
    private Long version;

    public static Nhan create(String ten) {
        Nhan tag = new Nhan();
        tag.rename(ten);
        return tag;
    }

    public void rename(String ten) {
        this.ten = ten;
    }
}
