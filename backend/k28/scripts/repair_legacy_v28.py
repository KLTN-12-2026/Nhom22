#!/usr/bin/env python3
"""Reconcile the FE branch's legacy V28 with main's migrations, preserving data.

Read-only by default. Stop the API and take a verified mysqldump backup before
using --apply. Rehearse against a database restored from that backup first.
"""

import argparse
import gzip
import hashlib
import json
from pathlib import Path
import re
import subprocess
import zlib


ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS = ROOT / 'src/main/resources/db/migration'
LEGACY_SCRIPT = 'V28__admin_motivation.sql'
LEGACY_CHECKSUM = -34270287


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def ident(value):
    require(re.fullmatch(r'[A-Za-z0-9_]+', value), 'Unsafe SQL identifier')
    return '`' + value + '`'


def literal(value):
    return "'" + value.replace("'", "''") + "'"


def checksum(source):
    result = 0
    for line in source.lstrip('\ufeff').splitlines():
        result = zlib.crc32(line.encode('utf-8'), result)
    return result if result < 2**31 else result - 2**32


class Database:
    def __init__(self, name):
        if name:
            ident(name)
        self.name = name or ''

    def execute(self, sql):
        result = subprocess.run([
            'docker', 'compose', 'exec', '-T', 'mysql', 'sh', '-c',
            'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysql -uroot '
            '--default-character-set=utf8mb4 --batch --skip-column-names '
            '"${1:-$MYSQL_DATABASE}"',
            'sh', self.name,
        ], cwd=ROOT, input=sql.encode('utf-8'), capture_output=True)
        require(result.returncode == 0, result.stderr.decode(errors='replace')[-2000:])
        return result.stdout

    def rows(self, sql):
        return [line.split('\t') for line in self.execute(sql).decode().splitlines()]

    def scalar(self, sql):
        return self.rows(sql)[0][0]


def fingerprint(db, table, columns, primary, where=''):
    selection = ', '.join(ident(column) for column in columns)
    order = ', '.join(ident(column) for column in primary)
    data = db.execute(f'SELECT {selection} FROM {ident(table)} {where} ORDER BY {order};')
    count = int(db.scalar(f'SELECT COUNT(*) FROM {ident(table)} {where};'))
    return {'rows': count, 'sha256': hashlib.sha256(data).hexdigest()}


def snapshot(db):
    tables = db.rows("SELECT TABLE_NAME FROM information_schema.TABLES "
                     "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE' "
                     "AND TABLE_NAME <> 'flyway_schema_history' ORDER BY TABLE_NAME;")
    result = {}
    for [table] in tables:
        columns = [r[0] for r in db.rows('SELECT COLUMN_NAME FROM information_schema.COLUMNS '
                   f'WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = {literal(table)} '
                   'ORDER BY ORDINAL_POSITION;')]
        primary = [r[0] for r in db.rows('SELECT COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE '
                   f'WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = {literal(table)} '
                   "AND CONSTRAINT_NAME = 'PRIMARY' ORDER BY ORDINAL_POSITION;")]
        require(primary, f'{table} has no primary key; refusing unverified conversion')
        # V33 adds three new badges. Verify every existing badge independently.
        where = ''
        if table == 'huy_hieu':
            maximum = int(db.scalar('SELECT COALESCE(MAX(id), 0) FROM huy_hieu;'))
            where = f'WHERE id <= {maximum}'
        result[table] = {'columns': columns, 'primary': primary, 'where': where,
                         **fingerprint(db, table, columns, primary, where)}
    return result


def save_private(path, content):
    path.write_text(content)
    path.chmod(0o600)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--database', help='Default: compose MySQL database')
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--backup-dir', type=Path)
    args = parser.parse_args()
    db = Database(args.database)
    name = db.scalar('SELECT DATABASE();')
    ident(name)

    history = db.rows('SELECT installed_rank, version, script, checksum, success '
                      'FROM flyway_schema_history WHERE version IS NOT NULL '
                      'ORDER BY installed_rank;')
    legacy = [row for row in history if row[1] == '28']
    require(len(legacy) == 1, 'Expected exactly one legacy V28 record')
    legacy = legacy[0]
    require(legacy[2:] == [LEGACY_SCRIPT, str(LEGACY_CHECKSUM), '1'],
            'Database is not the known FE V28 state; no automatic changes allowed')
    require(all(row[4] == '1' for row in history), 'Database has a failed migration')
    require(all(row[1].isdigit() and int(row[1]) <= 28 for row in history),
            'Database already has other migration versions; inspect manually')
    for row in history:
        if row is legacy:
            continue
        candidates = list(MIGRATIONS.glob(f'V{row[1]}__*.sql'))
        require(len(candidates) == 1 and checksum(candidates[0].read_text()) == int(row[3]),
                f'Unexpected earlier migration {row[1]}; inspect manually')

    columns = db.rows("SELECT TABLE_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT "
                      "FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() "
                      "AND TABLE_NAME IN ('huy_hieu','thu_thach') AND COLUMN_NAME = 'version' "
                      "ORDER BY TABLE_NAME;")
    require(columns == [['huy_hieu', 'bigint', 'NO', '0'], ['thu_thach', 'bigint', 'NO', '0']],
            'Legacy version columns do not match the migration')
    incoming = ['thong_bao_he_thong', 'yeu_cau_cong_khai', 'tu_dien',
                'khoi_phuc_chuoi', 'cai_dat_rieng_tu', 'vinh_danh_tuan']
    existing = db.rows('SELECT TABLE_NAME FROM information_schema.TABLES '
                       'WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('
                       + ','.join(literal(table) for table in incoming) + ');')
    require(not existing, 'Incoming tables already exist; refusing partial/repeated conversion')
    require(db.scalar("SELECT COUNT(*) FROM huy_hieu WHERE ma IN "
                      "('TOP_10_TUAN','TOP_3_TUAN','QUAN_QUAN_TUAN');") == '0',
            'Weekly badge codes already exist; inspect before applying V33')

    files = []
    for version in range(28, 35):
        candidates = list(MIGRATIONS.glob(f'V{version}__*.sql'))
        require(len(candidates) == 1, f'Expected one source migration V{version}')
        files.append((version, candidates[0], candidates[0].read_text()))
    final_sql = files[-1][2]
    checks = {}
    for field in ['hanh_dong', 'loai_doi_tuong']:
        match = re.search(r'CHECK \(' + field + r' IN \(.*?\)\)', final_sql, re.S)
        require(match, f'Missing final constraint for {field}')
        checks[field] = match.group(0)
        values = re.findall(r"'([^']+)'", match.group(0))
        invalid = db.scalar(f'SELECT COUNT(*) FROM nhat_ky_quan_tri WHERE {ident(field)} NOT IN ('
                            + ','.join(literal(value) for value in values) + ');')
        require(invalid == '0', f'Existing audit values unsupported by V34: {field}')

    # Apply main's missing SQL, retaining the already valid legacy audit types
    # while intermediate V28/V29 constraints are replaced. Final V34 restores
    # exactly the combined constraints in the canonical source migration.
    statements = []
    for version, path, source in files:
        sql = source
        if version in (28, 29):
            for field, check in checks.items():
                sql = re.sub(r'CHECK \(' + field + r' IN \(.*?\)\)', lambda m: check, sql, flags=re.S)
        if version == 34:
            for table in ['huy_hieu', 'thu_thach']:
                statement = f'ALTER TABLE {table} ADD COLUMN version BIGINT NOT NULL DEFAULT 0;'
                require(sql.count(statement) == 1, 'Unexpected V34 column definition')
                sql = sql.replace(statement, '-- Column already applied by legacy V28: ' + table)
        statements.append(f'-- Apply {path.name}\n{sql.strip()}\n')

    # Only reconcile metadata after all schema changes succeed. Keep the old
    # history and exact executed SQL in the backup directory for review.
    rank = int(db.scalar('SELECT MAX(installed_rank) FROM flyway_schema_history;'))
    statements.append('START TRANSACTION;')
    version, path, source = files[0]
    description = path.stem.split('__', 1)[1].replace('_', ' ')
    statements.append('UPDATE flyway_schema_history SET '
        f'description={literal(description)}, script={literal(path.name)}, checksum={checksum(source)}, '
        'installed_on=CURRENT_TIMESTAMP, execution_time=0 '
        f'WHERE installed_rank={int(legacy[0])} AND version=\'28\' '
        f'AND script={literal(LEGACY_SCRIPT)} AND checksum={LEGACY_CHECKSUM} AND success=1;')
    for version, path, source in files[1:]:
        rank += 1
        description = path.stem.split('__', 1)[1].replace('_', ' ')
        statements.append('INSERT INTO flyway_schema_history '
            '(installed_rank,version,description,type,script,checksum,installed_by,execution_time,success) VALUES '
            f'({rank},{literal(str(version))},{literal(description)},\'SQL\',{literal(path.name)},'
            f'{checksum(source)},SUBSTRING_INDEX(CURRENT_USER(),\'@\',1),0,1);')
    statements.append('COMMIT;')
    sql = '\n\n'.join(statements) + '\n'
    print(f'{name}: confirmed legacy V28; prepared canonical V28–V34 conversion.')
    if not args.apply:
        print('Read-only inspection complete. No database changes made.')
        return

    require(args.backup_dir and args.backup_dir.is_dir(), '--apply requires --backup-dir')
    backup = args.backup_dir.resolve()
    manifest = json.loads((backup / 'manifest.json').read_text())
    archive = backup / 'mysql.sql.gz'
    require(hashlib.sha256(archive.read_bytes()).hexdigest() == manifest['sha256'],
            'Backup checksum mismatch')
    with gzip.open(archive, 'rt', encoding='utf-8') as saved:
        dump = saved.read()
    require(LEGACY_SCRIPT in dump and str(LEGACY_CHECKSUM) in dump,
            'Backup does not contain the legacy V28 history')
    before = snapshot(db)
    save_private(backup / f'{name}-before.json', json.dumps({'history': history, 'tables': before}, indent=2)+'\n')
    save_private(backup / f'{name}-conversion.sql', sql)
    db.execute(sql)
    for table, spec in before.items():
        after = fingerprint(db, table, spec['columns'], spec['primary'], spec['where'])
        require(after == {key: spec[key] for key in ['rows','sha256']},
                f'Existing data verification failed: {table}')
    actual = db.rows('SELECT version, script, checksum, success FROM flyway_schema_history '
                     "WHERE version IN ('28','29','30','31','32','33','34') ORDER BY installed_rank;")
    expected = [[str(version), path.name, str(checksum(source)), '1'] for version, path, source in files]
    require(actual == expected, 'Final Flyway history verification failed')
    save_private(backup / f'{name}-verified.json', json.dumps({'history': actual, 'preserved_tables': len(before)}, indent=2)+'\n')
    print(f'Converted successfully; existing rows verified unchanged across {len(before)} tables.')
    print('Canonical V28–V34 scripts and checksums verified.')


if __name__ == '__main__':
    main()
