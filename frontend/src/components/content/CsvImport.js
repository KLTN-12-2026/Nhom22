'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button, ErrorState, Pagination } from '@/components/ui';
import { useDeck } from '@/hooks/useDeck';
import { useMe } from '@/hooks/useMe';
import { apiFetch } from '@/lib/api-client';
import { CSV_FIELDS, CSV_LABELS, CSV_TEMPLATE, csvHeaders, saveDownload } from '@/lib/csv.mjs';
import styles from './CsvImport.module.css';

export function CsvImport({ deckId }) {
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
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [now, setNow] = useState(Date.now);
  const locked = useRef(false);
  const heading = useRef(null);
  const storageKey = `csv-preview:${me.data?.id}:${deckId}`;

  useEffect(() => {
    const restore = setTimeout(() => {
      try {
        const saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
        if (saved?.preview?.boTheId === deckId && Array.isArray(saved.selected) && (Date.parse(saved.preview.expiresAt) > Date.now() || saved.attempt)) {
          setPreview(saved.preview); setSelected(saved.selected); setAttempt(saved.attempt);
        }
      } catch { sessionStorage.removeItem(storageKey); }
    }, 0);
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearInterval(timer); clearTimeout(restore); };
  }, [deckId, storageKey]);

  function persist(nextPreview, nextSelected, nextAttempt) {
    sessionStorage.setItem(storageKey, JSON.stringify({ preview: nextPreview, selected: nextSelected, attempt: nextAttempt }));
  }

  async function pick(nextFile) {
    if (!nextFile || locked.current || attempt) return;
    locked.current = true; setBusy(true); setError(null);
    try {
      if (!nextFile.size || nextFile.size > 1048576) throw new Error('Chọn tệp có dữ liệu, tối đa 1 MB.');
      const text = new TextDecoder('utf-8', { fatal: true }).decode(await nextFile.arrayBuffer());
      const columns = csvHeaders(text);
      setFile(nextFile); setHeaders(columns);
      setMapping(Object.fromEntries(CSV_FIELDS.filter(field => columns.includes(field)).map(field => [field, field])));
      setPreview(null); setResult(null); setSelected([]); sessionStorage.removeItem(storageKey);
    } catch (failure) { setError(failure); }
    finally { locked.current = false; setBusy(false); }
  }

  async function readPreview() {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError(null);
    try {
      const columns = Object.fromEntries(Object.entries(mapping).filter(([, source]) => source));
      if (!columns.tu || !columns.nghiaVi || new Set(Object.values(columns)).size !== Object.keys(columns).length) throw new Error('Ánh xạ từ và nghĩa; mỗi cột nguồn chỉ dùng một lần.');
      const body = new FormData(); body.append('file', file);
      body.append('mapping', new Blob([JSON.stringify(columns)], { type: 'application/json' }));
      const response = await apiFetch(`/api/v1/decks/${deckId}/imports/preview`, { method: 'POST', body });
      const numbers = response.rows.filter(row => row.valid).map(row => row.rowNumber);
      persist(response, numbers, null);
      setPreview(response); setSelected(numbers); setAttempt(null); setFilter('all'); setPage(1);
      setTimeout(() => heading.current?.focus(), 0);
    } catch (failure) { setError(failure); }
    finally { locked.current = false; setBusy(false); }
  }

  function choose(numbers) {
    if (attempt || busy) return;
    setSelected(numbers);
    try { persist(preview, numbers, null); } catch (failure) { setError(failure); }
  }

  async function commit() {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError(null);
    try {
      const pending = attempt || { key: crypto.randomUUID(), rows: [...selected].sort((a, b) => a - b) };
      persist(preview, pending.rows, pending);
      setAttempt(pending);
      const response = await apiFetch(`/api/v1/imports/${preview.importId}/commit`, {
        method: 'POST', headers: { 'Idempotency-Key': pending.key }, body: JSON.stringify({ rowNumbers: pending.rows })
      });
      setResult(response); sessionStorage.removeItem(storageKey);
      client.invalidateQueries({ queryKey: ['deck-cards', deckId] });
      client.invalidateQueries({ queryKey: ['my-decks'] });
      client.invalidateQueries({ queryKey: ['deck', deckId] });
      setTimeout(() => heading.current?.focus(), 0);
    } catch (failure) { setError(failure); }
    finally { locked.current = false; setBusy(false); }
  }

  function restart() {
    setPreview(null); setAttempt(null); setResult(null); setError(null); setFile(null); setHeaders([]);
    sessionStorage.removeItem(storageKey);
  }

  if (deck.isLoading) return <div className="page sheet" role="status">Đang tải bộ thẻ…</div>;
  if (deck.error) return <div className="page sheet"><ErrorState description={deck.error.message} onRetry={deck.refetch} /></div>;
  const expired = preview && Date.parse(preview.expiresAt) <= now;
  const visible = preview?.rows.filter(row => filter === 'all' || (filter === 'error' ? !row.valid : filter === 'duplicate' ? row.valid && row.trung : row.valid)) || [];
  return <div className="page page-grid with-side">
    <section className="sheet">
      <Link href={`/bo-the/${deckId}`} className="btn btn-quiet">← {deck.data?.ten || 'Bộ thẻ'}</Link>
      <div className="form-head"><div className="form-code">Phiếu nhập thẻ từ CSV</div><h1 ref={heading} tabIndex={-1}>{result ? 'Đã nhập thẻ' : 'Nhập thẻ từ tệp CSV'}</h1><p>Xem trước và chọn dòng hợp lệ. Dòng trùng được cảnh báo và vẫn có thể nhập.</p></div>
      <ol className="steps" aria-label="Các bước">{['Chọn tệp', 'Xem trước', 'Kết quả'].map((label, index) => <li key={label} data-state={(result ? 2 : preview ? 1 : 0) === index ? 'current' : undefined}><span className="bubble">{index + 1}</span><span className="step-label">{label}</span></li>)}</ol>
      {error && <div className="notice notice-danger" role="alert">{error.message}</div>}
      {result ? <div className={styles.stack}><p className={styles.result}>{result.importedCount}</p><h2>thẻ đã được thêm vào bộ</h2><p>Các dòng không chọn không được nhập.</p><div className="row"><Link className="btn btn-primary" href={`/bo-the/${deckId}?imported=${result.importedCount}`}>Mở bộ thẻ</Link><Button variant="ghost" onClick={restart}>Nhập tệp khác</Button></div></div> : !preview ? <div className={styles.stack}>
        <label className="dropzone" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); pick(event.dataTransfer.files[0]); }}><strong>Chọn tệp CSV</strong><span>UTF-8, tối đa 1 MB và 1000 dòng dữ liệu</span><input disabled={busy} type="file" accept=".csv,text/csv" onChange={event => { pick(event.target.files[0]); event.target.value = ''; }} /></label>
        <Button variant="ghost" onClick={() => saveDownload(new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' }), 'mau-nhap-the.csv')}>Tải tệp mẫu</Button>
        {file && <><p>{file.name}</p><h2>Ánh xạ cột</h2><div className={styles.mapping}>{CSV_FIELDS.map(field => <label key={field}>{CSV_LABELS[field]}{['tu', 'nghiaVi'].includes(field) ? ' *' : ''}<select aria-label={CSV_LABELS[field] + (['tu', 'nghiaVi'].includes(field) ? ' *' : '')} disabled={busy} value={mapping[field] || ''} onChange={event => setMapping({ ...mapping, [field]: event.target.value })}><option value="">Không nhập</option>{headers.map(header => <option key={header}>{header}</option>)}</select></label>)}</div><Button loading={busy} onClick={readPreview}>Xem trước tệp</Button></>}
      </div> : <div className={styles.stack}>
        <div className="row"><span className="stamp stamp-success">{preview.validRows} hợp lệ</span><span className="stamp stamp-danger">{preview.invalidRows} lỗi</span><span className="stamp stamp-warning">{preview.rows.filter(row => row.valid && row.trung).length} trùng</span></div>
        <p className="small muted">{expired ? 'Bản xem trước đã hết hạn.' : `Hết hạn lúc ${new Date(preview.expiresAt).toLocaleTimeString('vi-VN')}.`} {preview.ignoredColumns.length > 0 && `Bỏ qua cột: ${preview.ignoredColumns.join(', ')}.`}</p>
        {attempt && <p className="notice notice-warning">Yêu cầu đã được gửi. Giữ nguyên lựa chọn để thử lại an toàn, kể cả khi bản xem trước hết hạn.</p>}
        <div className="row">{[['all', 'Tất cả'], ['valid', 'Hợp lệ'], ['duplicate', 'Trùng'], ['error', 'Lỗi']].map(([value, label]) => <Button key={value} variant="ghost" aria-pressed={filter === value} onClick={() => { setFilter(value); setPage(1); }}>{label}</Button>)}</div>
        <label className="row"><input type="checkbox" disabled={busy || !!attempt || !preview.validRows} checked={!!preview.validRows && selected.length === preview.validRows} onChange={event => choose(event.target.checked ? preview.rows.filter(row => row.valid).map(row => row.rowNumber) : [])} />Chọn tất cả dòng hợp lệ</label>
        <div className={styles.tableWrap}><table className="data-table"><caption className="sr-only">Các dòng trong tệp CSV</caption><thead><tr><th>Chọn</th><th>Dòng</th><th>Từ</th><th>Từ loại</th><th>Nghĩa</th><th>Ghi chú</th></tr></thead><tbody>{visible.slice((page - 1) * 50, page * 50).map(row => <tr key={row.rowNumber}><td><input type="checkbox" aria-label={`Chọn dòng ${row.rowNumber}`} disabled={!row.valid || busy || !!attempt} checked={selected.includes(row.rowNumber)} onChange={event => choose(event.target.checked ? [...selected, row.rowNumber] : selected.filter(number => number !== row.rowNumber))} /></td><td>{row.rowNumber}</td><td lang="en">{row.data.tu || '—'}</td><td>{row.data.tuLoai}</td><td className={styles.meaning}>{row.data.nghiaVi || '—'}</td><td>{row.fieldErrors.map(item => <p key={`${item.field}:${item.message}`}>{item.field}: {item.message}</p>)}{row.valid && (row.trung ? `Có thể trùng${row.dongTrungNumbers.length ? ` dòng ${row.dongTrungNumbers.join(', ')}` : ' thẻ trong bộ'}` : 'Hợp lệ')}</td></tr>)}</tbody></table>{!visible.length && <p>Không có dòng trong nhóm này.</p>}</div>
        <Pagination page={page} totalPages={Math.ceil(visible.length / 50)} onPageChange={setPage} />
        <div className={styles.actions}><Button variant="ghost" disabled={busy} onClick={restart}>{attempt ? 'Kết thúc lượt này' : 'Chọn tệp khác'}</Button><Button loading={busy} disabled={!selected.length || (expired && !attempt)} onClick={commit}>{attempt ? 'Thử lại yêu cầu nhập' : `Nhập ${selected.length} dòng đã chọn`}</Button></div>
      </div>}
    </section>
    <aside className="side-col"><section className="panel"><h2 className="panel-title">Cột trong tệp</h2><dl>{CSV_FIELDS.map(field => <div key={field}><dt><strong>{field}</strong></dt><dd>{CSV_LABELS[field]}{['tu', 'nghiaVi'].includes(field) ? ' (bắt buộc)' : ''}</dd></div>)}</dl><p className="small muted">Dấu phẩy phân cột; dùng dấu ngoặc kép cho nội dung có dấu phẩy hoặc xuống dòng. ID nhãn cách nhau bằng dấu chấm phẩy. Không nhập ảnh, âm thanh hoặc tiến độ học.</p><p className="small muted">Export thêm dấu nháy đơn vào ô có nguy cơ công thức. Nhập lại giữ nguyên dấu này.</p></section></aside>
  </div>;
}
