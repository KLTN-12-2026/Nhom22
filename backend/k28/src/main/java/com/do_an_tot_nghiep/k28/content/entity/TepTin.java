package com.do_an_tot_nghiep.k28.content.entity;

import com.do_an_tot_nghiep.k28.common.entity.BaseEntity;
import com.do_an_tot_nghiep.k28.content.entity.enums.LoaiTep;
import com.do_an_tot_nghiep.k28.content.entity.enums.TrangThaiXoaTep;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TepTin extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(updatable = false)
    private Long chuSoHuuId;
    @Column(nullable = false, length = 200)
    private String objectKey;
    @Column(nullable = false, length = 100)
    private String mimeType;
    @Column(nullable = false)
    private long kichThuoc;
    @Column(nullable = false, length = 64)
    private String checksum;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private LoaiTep loai;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private TrangThaiXoaTep trangThaiXoa;

    private Instant hoanTatAt;
    private Instant xoaAt;
    private Instant daXoaObjectAt;

    public static TepTin pending(
            Long chuSoHuuId,
            String objectKey,
            String mimeType,
            long kichThuoc,
            String checksum,
            LoaiTep loai
    ) {
        TepTin file = new TepTin();
        file.chuSoHuuId = chuSoHuuId;
        file.objectKey = objectKey;
        file.mimeType = mimeType;
        file.kichThuoc = kichThuoc;
        file.checksum = checksum;
        file.loai = loai;
        file.trangThaiXoa = TrangThaiXoaTep.CON_HIEU_LUC;
        return file;
    }

    public static TepTin system(String objectKey, String mimeType, long kichThuoc, String checksum, Instant now) {
        return recording(null, objectKey, mimeType, kichThuoc, checksum, now);
    }

    public static TepTin recording(Long chuSoHuuId, String objectKey, String mimeType, long kichThuoc,
                                   String checksum, Instant now) {
        TepTin file = pending(chuSoHuuId, objectKey, mimeType, kichThuoc, checksum, LoaiTep.AM_THANH);
        file.hoanTatAt = now;
        return file;
    }

    public static TepTin copyOf(TepTin source, Long chuSoHuuId, String objectKey, Instant now) {
        TepTin file = pending(chuSoHuuId, objectKey, source.mimeType, source.kichThuoc, source.checksum, source.loai);
        file.hoanTatAt = now;
        return file;
    }

    public void complete(String verifiedObjectKey, String verifiedMimeType,
                         long verifiedSize, String verifiedChecksum, Instant now) {
        objectKey = verifiedObjectKey;
        mimeType = verifiedMimeType;
        kichThuoc = verifiedSize;
        checksum = verifiedChecksum;
        hoanTatAt = now;
    }

    public void markDeleted(Instant now) {
        trangThaiXoa = TrangThaiXoaTep.DA_XOA;
        xoaAt = now;
    }

}
