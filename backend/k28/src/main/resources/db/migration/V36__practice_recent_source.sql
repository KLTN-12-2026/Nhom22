ALTER TABLE bai_luyen
    DROP CHECK ck_bai_luyen_nguon;

ALTER TABLE bai_luyen
    ADD CONSTRAINT ck_bai_luyen_nguon
        CHECK (nguon IN ('BO_THE', 'SO_TAY', 'VUA_HOC'));
