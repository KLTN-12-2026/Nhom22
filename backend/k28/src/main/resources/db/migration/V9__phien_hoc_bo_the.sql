ALTER TABLE phien_hoc
    ADD COLUMN bo_the_id BIGINT NULL AFTER nguoi_dung_id,
    ADD CONSTRAINT fk_phien_hoc_bo_the
        FOREIGN KEY (bo_the_id) REFERENCES bo_the (id);