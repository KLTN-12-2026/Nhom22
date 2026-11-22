SET @sql = IF(
    EXISTS (
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'huy_hieu'
          AND COLUMN_NAME = 'version'
    ),
    'SELECT 1',
    'ALTER TABLE huy_hieu ADD COLUMN version BIGINT NOT NULL DEFAULT 0'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
    EXISTS (
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'thu_thach'
          AND COLUMN_NAME = 'version'
    ),
    'SELECT 1',
    'ALTER TABLE thu_thach ADD COLUMN version BIGINT NOT NULL DEFAULT 0'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
