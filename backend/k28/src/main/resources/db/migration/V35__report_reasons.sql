ALTER TABLE bao_cao_noi_dung
    DROP CHECK ck_bao_cao_ly_do,
    DROP CHECK ck_bao_cao_mo_ta;

ALTER TABLE bao_cao_noi_dung
    MODIFY mo_ta VARCHAR(500) NULL;

ALTER TABLE bao_cao_noi_dung
    ADD CONSTRAINT ck_bao_cao_ly_do
        CHECK (ly_do IN ('SAI_NOI_DUNG', 'SAI_CHINH_TA', 'KHONG_PHU_HOP', 'SPAM', 'BAN_QUYEN', 'KHAC')),
    ADD CONSTRAINT ck_bao_cao_mo_ta
        CHECK ((ly_do = 'KHAC' AND CHAR_LENGTH(mo_ta) BETWEEN 10 AND 500)
            OR (ly_do <> 'KHAC' AND (mo_ta IS NULL OR CHAR_LENGTH(mo_ta) BETWEEN 1 AND 500)));
