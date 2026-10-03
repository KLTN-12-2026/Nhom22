package com.do_an_tot_nghiep.k28.content.entity;

import com.do_an_tot_nghiep.k28.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
public class ChuDe extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String ten;

    @Column(length = 500)
    private String moTa;

    @Version
    private Long version;

    public static ChuDe create(String ten, String moTa) {
        ChuDe topic = new ChuDe();
        topic.rename(ten, moTa);
        return topic;
    }

    public void rename(String ten, String moTa) {
        this.ten = ten;
        this.moTa = moTa;
    }
}
