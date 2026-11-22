ALTER TABLE phien_hoc
    ADD COLUMN hoc_tu_do BOOLEAN NOT NULL DEFAULT FALSE AFTER che_do;

UPDATE phien_hoc SET hoc_tu_do = TRUE WHERE bo_the_id IS NOT NULL;
