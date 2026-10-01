ALTER TABLE tep_tin ADD COLUMN da_xoa_object_at DATETIME(3) NULL;
CREATE INDEX idx_tep_tin_cho_xoa ON tep_tin (trang_thai_xoa, da_xoa_object_at, id);
