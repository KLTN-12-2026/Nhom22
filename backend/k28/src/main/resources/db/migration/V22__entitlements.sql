ALTER TABLE bo_the
    ADD COLUMN cao_cap BOOLEAN NOT NULL DEFAULT FALSE,
    ADD CONSTRAINT ck_bo_the_cao_cap CHECK (cao_cap = FALSE OR bo_mau = TRUE);
