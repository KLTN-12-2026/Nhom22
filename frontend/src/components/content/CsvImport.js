'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ErrorState, Pagination } from '@/components/ui';
import { useDeck } from '@/hooks/useDeck';
import { useMe } from '@/hooks/useMe';
import { apiFetch } from '@/lib/api-client';
import { CSV_FIELDS, CSV_LABELS, CSV_TEMPLATE, csvHeaders, saveDownload } from '@/lib/csv.mjs';
import styles from './CsvImport.module.css';

const SAMPLE_CSV =
  'tu,tuLoai,phienAm,nghiaVi,viDuEn,dichVi\n' +
  'deadline,n.,/ˈdedlaɪn/,hạn chót,The deadline is next Monday.,Hạn chót là thứ Hai tới.\n' +
  'negotiate,v.,/nɪˈɡoʊʃieɪt/,đàm phán,We need to negotiate the price.,Chúng ta cần đàm phán giá.\n' +
  'receipt,n.,/rɪˈsiːt/,biên lai,Keep your receipt.,Giữ biên lai của bạn.\n' +
  'warehouse,n.,/ˈwerhaʊs/,,The goods are stored in the warehouse.,\n' +
  '"=HYPERLINK(""http://example.com"")",n.,,liên kết,,\n' +
  'brochure,n.,/broʊˈʃʊr/,tờ rơi quảng cáo,"Take a brochure, please.",Mời bạn lấy một tờ rơi.\n' +
  'brochure,n.,/broʊˈʃʊr/,tập sách giới thiệu,,\n' +
  ',adj.,,miễn phí,,\n';

export function CsvImport({ deckId, availableDecks, onDeckChange }) {
  const deck = useDeck(deckId);
  const me = useMe();
  const client = useQueryClient();

  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [preview, setPreview] = useState(null);
  const [selected, setSelected] = useState([]);
  const [attempt, setAttempt] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [now, setNow] = useState(Date.now);
  const [isDragOver, setIsDragOver] = useState(false);

  const locked = useRef(false);
  const heading = useRef(null);
  const storageKey = `csv-preview:${me.data?.id}:${deckId}`;

  useEffect(() => {
    const restore = setTimeout(() => {
      try {
        const saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
        if (
          saved?.preview?.boTheId === deckId &&
          Array.isArray(saved.selected) &&
          (Date.parse(saved.preview.expiresAt) > Date.now() || saved.attempt)
        ) {
          setPreview(saved.preview);
          setSelected(saved.selected);
          setAttempt(saved.attempt);
        }
      } catch {
        sessionStorage.removeItem(storageKey);
      }
    }, 0);
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(timer);
      clearTimeout(restore);
    };
  }, [deckId, storageKey]);

  function persist(nextPreview, nextSelected, nextAttempt) {
    sessionStorage.setItem(
      storageKey,
      JSON.stringify({ preview: nextPreview, selected: nextSelected, attempt: nextAttempt })
    );
  }

  async function pick(nextFile, autoPreview = false) {
    if (!nextFile || locked.current || attempt) return;
    locked.current = true;
    setBusy(true);
    setError(null);
    try {
      if (!nextFile.size || nextFile.size > 1048576) throw new Error('Tệp CSV tối đa 1 MB');
      const text = new TextDecoder('utf-8', { fatal: true }).decode(await nextFile.arrayBuffer());
      const columns = csvHeaders(text);
      setFile(nextFile);
      setHeaders(columns);
      const defaultMapping = Object.fromEntries(
        CSV_FIELDS.filter(field => columns.includes(field)).map(field => [field, field])
      );
      setMapping(defaultMapping);
      setPreview(null);
      setResult(null);
      setSelected([]);
      sessionStorage.removeItem(storageKey);

      if (autoPreview) {
        locked.current = false;
        setBusy(false);
        await readPreview(nextFile, defaultMapping);
        return;
      }
    } catch (failure) {
      setError(failure);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  async function readPreview(customFile, customMapping) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError(null);
    try {
      const activeFile = customFile || file;
      const activeMapping = customMapping || mapping;
      const columns = Object.fromEntries(Object.entries(activeMapping).filter(([, source]) => source));
      if (!columns.tu || !columns.nghiaVi || new Set(Object.values(columns)).size !== Object.keys(columns).length) {
        throw new Error('Ánh xạ từ và nghĩa; mỗi cột nguồn chỉ dùng một lần.');
      }
      const body = new FormData();
      body.append('file', activeFile);
      body.append('mapping', new Blob([JSON.stringify(columns)], { type: 'application/json' }));
      const response = await apiFetch(`/api/v1/decks/${deckId}/imports/preview`, { method: 'POST', body });
      const numbers = response.rows.filter(row => row.valid).map(row => row.rowNumber);
      persist(response, numbers, null);
      setPreview(response);
      setSelected(numbers);
      setAttempt(null);
      setFilter('ALL');
      setPage(1);
      setTimeout(() => heading.current?.focus(), 0);
    } catch (failure) {
      setError(failure);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  function choose(numbers) {
    if (attempt || busy) return;
    setSelected(numbers);
    try {
      persist(preview, numbers, null);
    } catch (failure) {
      setError(failure);
    }
  }

  async function commit() {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError(null);
    try {
      const pending = attempt || { key: crypto.randomUUID(), rows: [...selected].sort((a, b) => a - b) };
      persist(preview, pending.rows, pending);
      setAttempt(pending);
      const response = await apiFetch(`/api/v1/imports/${preview.importId}/commit`, {
        method: 'POST',
        headers: { 'Idempotency-Key': pending.key },
        body: JSON.stringify({ rowNumbers: pending.rows }),
      });
      setResult(response);
      sessionStorage.removeItem(storageKey);
      client.invalidateQueries({ queryKey: ['deck-cards', deckId] });
      client.invalidateQueries({ queryKey: ['my-decks'] });
      client.invalidateQueries({ queryKey: ['deck', deckId] });
      setTimeout(() => heading.current?.focus(), 0);
    } catch (failure) {
      setError(failure);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  function restart() {
    setPreview(null);
    setAttempt(null);
    setResult(null);
    setError(null);
    setFile(null);
    setHeaders([]);
    sessionStorage.removeItem(storageKey);
  }

  if (deck.isLoading) return <div className="page sheet" role="status">Đang tải bộ thẻ…</div>;
  if (deck.error) return <div className="page sheet"><ErrorState description={deck.error.message} onRetry={deck.refetch} /></div>;

  const expired = preview && Date.parse(preview.expiresAt) <= now;
  const visible = preview?.rows.filter(row => {
    if (filter === 'ALL') return true;
    if (filter === 'OK') return row.valid && !row.trung;
    if (filter === 'DUPLICATE') return row.valid && row.trung;
    if (filter === 'ERROR') return !row.valid;
    return true;
  }) || [];

  const deckName = deck.data?.ten || 'Bộ thẻ';
  const deckCode = `Bộ đích: ${deckName.length > 30 ? deckName.slice(0, 30) + '…' : deckName}`;
  const backLabel = deckName.length > 40 ? deckName.slice(0, 40) + '…' : deckName;

  const currentStep = result ? 2 : preview ? 1 : 0;

  return (
    <div className="page page-grid with-side">
      <section className="sheet" aria-labelledby="page-title">
        <div className="form-head">
          <div className="form-code">
            <span>Phiếu nhập thẻ từ CSV</span>
            {availableDecks?.length > 1 ? (
              <span className={styles.deckSelector}>
                <label htmlFor="deck-select">Bộ đích: </label>
                <select
                  id="deck-select"
                  value={deckId || ''}
                  onChange={event => onDeckChange?.(event.target.value)}
                  className={styles.deckSelectInput}
                >
                  {availableDecks.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.ten}
                    </option>
                  ))}
                </select>
              </span>
            ) : (
              <span id="deck-code">{deckCode}</span>
            )}
          </div>
          <Link
            className="btn btn-quiet"
            id="back"
            href={deckId ? `/bo-the/${deckId}` : '/bo-the'}
            style={{ margin: '0 0 var(--sp-2) -12px', justifySelf: 'start' }}
          >
            <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19 12H5M11 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span id="back-label">{backLabel}</span>
          </Link>
          <h1 id="page-title" ref={heading} tabIndex={-1}>
            {result ? 'Đã nhập thẻ' : 'Nhập thẻ từ tệp CSV'}
          </h1>
          <p>Xem trước từng dòng trước khi nhập. Dòng lỗi không bao giờ được ghi vào bộ thẻ.</p>
        </div>

        <ol className="steps" id="steps" aria-label="Các bước">
          {['Chọn tệp', 'Xem trước', 'Kết quả'].map((label, index) => {
            const state = index < currentStep ? 'done' : index === currentStep ? 'current' : undefined;
            return (
              <li key={label} data-state={state}>
                <span className="bubble">{index + 1}</span>
                <span className="step-bar" />
                <span className="step-label">{label}</span>
              </li>
            );
          })}
        </ol>

        {/* Step 1: Chọn tệp */}
        {!preview && !result && (
          <div className={styles.csvStep} data-step="1">
            {error && (
              <div className="notice notice-danger" role="alert">
                <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                  <path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <div>
                  <p className="notice-title">{error.message}</p>
                  {error.requestId && <p className="request-id">Mã yêu cầu: {error.requestId}</p>}
                </div>
              </div>
            )}

            <label
              className="dropzone"
              id="drop"
              data-over={isDragOver ? '' : undefined}
              onDragOver={event => {
                event.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={event => {
                event.preventDefault();
                setIsDragOver(false);
                pick(event.dataTransfer.files[0]);
              }}
            >
              <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 16V4M7 9l5-5 5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ fontWeight: 650 }}>Chọn tệp CSV</span>
              <span className="muted small">hoặc kéo thả vào đây. Mã hóa UTF-8, tối đa 1 MB và 1000 dòng.</span>
              <input
                disabled={busy}
                type="file"
                id="file"
                accept=".csv,text/csv"
                onChange={event => {
                  pick(event.target.files[0]);
                  event.target.value = '';
                }}
              />
            </label>

            <div className="row">
              <button
                type="button"
                className="btn btn-quiet"
                id="template"
                onClick={() => saveDownload(new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' }), 'mau-nhap-the.csv')}
              >
                <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 4v12M7 11l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Tải tệp mẫu
              </button>
              <button
                type="button"
                className="btn btn-quiet"
                id="sample"
                onClick={() => {
                  const sampleFile = new File([SAMPLE_CSV], 'du-lieu-thu.csv', { type: 'text/csv' });
                  pick(sampleFile, true);
                }}
              >
                Thử với dữ liệu có lỗi
              </button>
            </div>

            {file && (
              <>
                <p><strong>{file.name}</strong></p>
                <h2 style={{ fontSize: 'var(--fs-h3)', margin: 'var(--sp-2) 0' }}>Ánh xạ cột</h2>
                <div id="mapping" className={styles.mapping}>
                  {CSV_FIELDS.map(field => (
                    <label key={field}>
                      {CSV_LABELS[field]}{['tu', 'nghiaVi'].includes(field) ? ' *' : ''}
                      <select
                        aria-label={CSV_LABELS[field] + (['tu', 'nghiaVi'].includes(field) ? ' *' : '')}
                        disabled={busy}
                        value={mapping[field] || ''}
                        onChange={event => setMapping({ ...mapping, [field]: event.target.value })}
                      >
                        <option value="">Không nhập</option>
                        {headers.map(header => (
                          <option key={header} value={header}>{header}</option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  id="preview-file"
                  disabled={busy}
                  onClick={() => readPreview()}
                >
                  Xem trước tệp
                </button>
              </>
            )}

            {busy && (
              <p id="reading" className="muted" aria-live="polite">
                Đang đọc tệp…
              </p>
            )}
          </div>
        )}

        {/* Step 2: Xem trước */}
        {preview && !result && (
          <div className={styles.csvStep} data-step="2">
            <div className="row-between">
              <h2 tabIndex={-1} id="pv-title" style={{ fontSize: 'var(--fs-h3)' }}>
                Xem trước <span className="muted" id="file-name">{file?.name || 'tệp CSV'}</span>
              </h2>
              <div className={styles.counts} id="counts">
                <span className="stamp stamp-success">{preview.validRows} hợp lệ</span>
                <span className="stamp stamp-warning">
                  {preview.rows.filter(row => row.valid && row.trung).length} trùng
                </span>
                <span className="stamp stamp-danger">{preview.invalidRows} lỗi</span>
              </div>
            </div>

            <p className="small muted">
              {expired
                ? 'Bản xem trước đã hết hạn.'
                : `Hết hạn lúc ${new Date(preview.expiresAt).toLocaleTimeString('vi-VN')}.`}{' '}
              {preview.ignoredColumns?.length > 0 && `Bỏ qua cột: ${preview.ignoredColumns.join(', ')}.`}
            </p>

            {attempt && (
              <p className="notice notice-warning">
                Yêu cầu đã được gửi. Giữ nguyên lựa chọn để thử lại an toàn, kể cả khi bản xem trước hết hạn.
              </p>
            )}

            <div className="tabs" role="tablist" aria-label="Lọc dòng" id="filter">
              {[
                ['ALL', 'Tất cả'],
                ['OK', 'Hợp lệ'],
                ['DUPLICATE', 'Trùng'],
                ['ERROR', 'Lỗi'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className="tab"
                  role="tab"
                  aria-selected={filter === value}
                  data-f={value}
                  onClick={() => {
                    setFilter(value);
                    setPage(1);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <label className="choice" style={{ margin: 'var(--sp-2) 0', alignSelf: 'flex-start' }}>
              <input
                type="checkbox"
                disabled={busy || !!attempt || !preview.validRows}
                checked={!!preview.validRows && selected.length === preview.validRows}
                onChange={event =>
                  choose(event.target.checked ? preview.rows.filter(row => row.valid).map(row => row.rowNumber) : [])
                }
              />
              <span className="bubble box" aria-hidden="true">
                <svg className="box-check" viewBox="0 0 24 24">
                  <path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span>Chọn tất cả dòng hợp lệ ({preview.validRows})</span>
            </label>

            <div className={styles.tableWrap}>
              <table className="data-table">
                <caption className="sr-only">Các dòng trong tệp CSV</caption>
                <thead>
                  <tr>
                    <th scope="col"><span className="sr-only">Chọn</span></th>
                    <th scope="col">Dòng</th>
                    <th scope="col">Từ</th>
                    <th scope="col">Từ loại</th>
                    <th scope="col">IPA</th>
                    <th scope="col">Nghĩa</th>
                    <th scope="col">Ghi chú</th>
                  </tr>
                </thead>
                <tbody id="rows">
                  {visible.length ? (
                    visible.slice((page - 1) * 50, page * 50).map(row => {
                      const isError = !row.valid;
                      const isDup = row.valid && row.trung;
                      const status = isError ? 'error' : isDup ? 'dup' : 'ok';
                      const rowData = row.data || {};
                      const note = isError
                        ? (row.fieldErrors?.map(item => `${item.field}: ${item.message}`).join('; ') || 'Lỗi dữ liệu')
                        : isDup
                          ? (row.dongTrungNumbers?.length
                              ? `Có thể trùng dòng ${row.dongTrungNumbers.join(', ')}`
                              : 'Có thể trùng')
                          : 'Hợp lệ';

                      return (
                        <tr key={row.rowNumber} data-row={status}>
                          <td className="pick">
                            <label className="choice">
                              <input
                                type="checkbox"
                                aria-label={`Chọn dòng ${row.rowNumber}`}
                                disabled={!row.valid || busy || !!attempt}
                                checked={selected.includes(row.rowNumber)}
                                onChange={event =>
                                  choose(
                                    event.target.checked
                                      ? [...selected, row.rowNumber]
                                      : selected.filter(number => number !== row.rowNumber)
                                  )
                                }
                              />
                              <span className="bubble box" aria-hidden="true">
                                <svg className="box-check" viewBox="0 0 24 24">
                                  <path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </span>
                            </label>
                          </td>
                          <td className="line">{row.rowNumber}</td>
                          <td className="en" lang="en">{rowData.tu || <span className="muted">—</span>}</td>
                          <td>{rowData.tuLoai || ''}</td>
                          <td className="en" lang="en">{rowData.phienAm || ''}</td>
                          <td className="mean">{rowData.nghiaVi || <span className="muted">—</span>}</td>
                          <td className={isError ? 'cell-error' : ''}>{note}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="muted" style={{ textAlign: 'center', padding: 'var(--sp-4)' }}>
                        Không có dòng nào trong nhóm này.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination page={page} totalPages={Math.max(1, Math.ceil(visible.length / 50))} onPageChange={setPage} />

            <div className={styles.commitBar}>
              <button
                type="button"
                className="btn btn-quiet"
                id="restart"
                disabled={busy}
                onClick={restart}
              >
                {attempt ? 'Kết thúc lượt này' : 'Chọn tệp khác'}
              </button>
              <button
                type="button"
                className="btn btn-primary btn-lg"
                id="commit"
                disabled={!selected.length || (expired && !attempt) || busy}
                onClick={commit}
              >
                {attempt ? 'Thử lại yêu cầu nhập' : `Nhập ${selected.length} dòng đã chọn`}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Kết quả */}
        {result && (
          <div className={styles.csvStep} data-step="3">
            <div className="stack">
              <p className={styles.resultNum} id="created">{result.importedCount}</p>
              <h2 tabIndex={-1} id="done-title">thẻ đã được thêm vào bộ</h2>
              <p className="muted" id="skipped">Các dòng không chọn không được nhập.</p>
              <div className="row">
                <Link
                  className="btn btn-primary"
                  id="open-deck"
                  href={`/bo-the/${deckId}?imported=${result.importedCount}`}
                >
                  Mở bộ thẻ
                </Link>
                <button
                  type="button"
                  className="btn btn-quiet"
                  id="again"
                  onClick={restart}
                >
                  Nhập tệp khác
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Sidebar Spec */}
      <aside className="side-col">
        <section className="panel" aria-labelledby="spec-title">
          <h2 className="panel-title" id="spec-title">Cột trong tệp</h2>
          <table className={styles.spec}>
            <tbody>
              <tr><td>tu</td><td>Từ tiếng Anh <strong>(bắt buộc)</strong></td></tr>
              <tr><td>nghiaVi</td><td>Nghĩa tiếng Việt <strong>(bắt buộc)</strong></td></tr>
              <tr><td>tuLoai</td><td>Từ loại: n., v., adj.…</td></tr>
              <tr><td>phienAm</td><td>Phiên âm</td></tr>
              <tr><td>viDuEn</td><td>Câu ví dụ</td></tr>
              <tr><td>dichVi</td><td>Bản dịch ví dụ</td></tr>
            </tbody>
          </table>
          <p className="small muted" style={{ marginTop: 'var(--sp-3)' }}>
            Dòng đầu tiên là tên cột. Export thêm dấu nháy đơn vào ô có nguy cơ công thức. Nhập lại giữ nguyên dấu này. Không nhập tệp media hoặc tiến độ học.
          </p>
        </section>
      </aside>
    </div>
  );
}
