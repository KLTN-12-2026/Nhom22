ALTER TABLE bo_the
    DROP CHECK ck_bo_the_cao_cap,
    DROP COLUMN cao_cap;

ALTER TABLE goi_dich_vu
    DROP COLUMN bo_mau_cao_cap;
