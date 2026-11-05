'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { cardPayload, normalizeTerm } from '@/lib/content-contract.mjs';
import { ErrorState, Icon } from '@/components/ui';
import { FileUpload } from './FileUpload';
import { CardMedia } from './CardMedia';
import { SpeakButton } from './SpeakButton';
import styles from './CardEditor.module.css';

const IPA = ['ə', 'ɪ', 'iː', 'æ', 'ʌ', 'ɑː', 'ɒ', 'ɔː', 'ʊ', 'uː', 'ɜː', 'eɪ', 'aɪ', 'ɔɪ', 'aʊ', 'oʊ', 'θ', 'ð', 'ʃ', 'ʒ', 'tʃ', 'dʒ', 'ŋ', 'ˈ', 'ˌ', 'ː'];
const EMPTY = { tu: '', tuLoai: '', nghiaVi: '', phienAm: '', viDuEn: '', dichVi: '', doKho: 2, nguon: '', nhanIds: [], anhId: '', amTuId: '', amCauId: '' };

export function CardEditor({ deckId, initial, onSaved, onCancel, modal = false, onPending, heading }) {
  const client = useQueryClient();
  const [values, setValues] = useState(() => ({ ...EMPTY, ...initial, ...Object.fromEntries(Object.keys(EMPTY).filter(key => EMPTY[key] === '').map(key => [key, initial?.[key] || ''])) }));
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(0);
  const [saved, setSaved] = useState(null);
  const ipa = useRef(null);
  const tags = useQuery({ queryKey: ['public-tags'], queryFn: async () => {
    const first = await apiFetch('/api/v1/public/tags?size=100');
    const items = [...first.items];
    for (let page = 1; page < first.totalPages; page++) items.push(...(await apiFetch(`/api/v1/public/tags?size=100&page=${page}`)).items);
    return items;
  } });
  const existing = useQuery({ queryKey: ['deck-cards', deckId, 'editor'], queryFn: () => apiFetch(`/api/v1/decks/${deckId}/cards?size=100`) });
  const save = useMutation({
    mutationFn: body => apiFetch(initial ? `/api/v1/cards/${initial.id}` : `/api/v1/decks/${deckId}/cards`, { method: initial ? 'PATCH' : 'POST', body: JSON.stringify(body) }),
    onSuccess: card => {
      client.invalidateQueries({ queryKey: ['deck-cards', deckId] });
      client.invalidateQueries({ queryKey: ['deck', deckId] });
      setSaved(card);
    },
  });
  const pending = save.isPending || busy > 0;
  useEffect(() => { onPending?.(pending); }, [pending, onPending]);
  const change = (key, value) => { setValues(current => ({ ...current, [key]: value })); setFieldErrors(current => ({ ...current, [key]: '' })); };
  const errorFor = key => fieldErrors[key] || save.error?.fieldErrors?.find(item => item.field === key)?.message;
  const duplicate = existing.data?.items.find(card => card.id !== initial?.id && normalizeTerm(card.tu) === normalizeTerm(values.tu) && normalizeTerm(card.tuLoai || '') === normalizeTerm(values.tuLoai));
  const submit = event => {
    event.preventDefault();
    if (pending) return;
    let body;
    try { body = cardPayload(values, initial); }
    catch (error) { setFieldErrors(Object.fromEntries(error.issues.map(issue => [issue.path[0], issue.message]))); return; }
    const more = event.nativeEvent.submitter?.value === 'more';
    save.mutate(body, { onSuccess: card => { if (more) { setValues({ ...EMPTY }); setFieldErrors({}); } else onSaved(card); } });
  };
  const insertIpa = char => {
    const start = ipa.current.selectionStart, end = ipa.current.selectionEnd;
    change('phienAm', values.phienAm.slice(0, start) + char + values.phienAm.slice(end));
    requestAnimationFrame(() => { ipa.current.focus(); ipa.current.setSelectionRange(start + char.length, start + char.length); });
  };
  const field = (key, label, max, multiline = false, required = false, english = false) => <div className="field">
    <label className="field-label" htmlFor={`card-${key}`}>{label}{!required && <span className="optional">Không bắt buộc</span>}</label>
    {multiline ? <textarea id={`card-${key}`} className={`textarea${english ? ' en' : ''}`} lang={english ? 'en' : undefined} rows={3} maxLength={max} required={required} value={values[key]} onChange={event => change(key, event.target.value)} aria-invalid={!!errorFor(key)} aria-describedby={errorFor(key) ? `${key}-error` : undefined} /> : <input id={`card-${key}`} className={`input${english ? ' en' : ''}`} lang={english ? 'en' : undefined} maxLength={max} required={required} value={values[key]} onChange={event => change(key, event.target.value)} aria-invalid={!!errorFor(key)} aria-describedby={errorFor(key) ? `${key}-error` : undefined} />}
    {key === 'nghiaVi' && <p className="field-counter">{values[key].length}/500</p>}
    {errorFor(key) && <p id={`${key}-error`} className="field-error" role="alert">{errorFor(key)}</p>}
  </div>;
  return <div className={modal ? styles.modalGrid : 'page-grid with-side'}>
    <form className={`${styles.form} ${modal ? '' : 'sheet'}`} onSubmit={submit}>
      {heading}
      <fieldset disabled={pending} className={styles.fields}>
        <div className={styles.two}>{field('tu', 'Từ hoặc cụm từ tiếng Anh', 100, false, true, true)}<div className="field"><label className="field-label" htmlFor="card-tuLoai">Từ loại</label><select id="card-tuLoai" className="select" value={values.tuLoai} onChange={event => change('tuLoai', event.target.value)}><option value="">Không ghi</option>{['n.', 'v.', 'adj.', 'adv.', 'phr. v.', 'phr.', 'prep.', 'conj.'].map(pos => <option key={pos} value={pos}>{pos}</option>)}{values.tuLoai && !['n.', 'v.', 'adj.', 'adv.', 'phr. v.', 'phr.', 'prep.', 'conj.'].includes(values.tuLoai) && <option>{values.tuLoai}</option>}</select></div></div>
        {duplicate && values.tu.trim() && <p className="notice notice-warning" role="status">Bộ này đã có “{duplicate.tu}”. Bạn vẫn lưu được nếu đây là nghĩa khác.</p>}
        <div className="field"><label className="field-label" htmlFor="card-phienAm">Phiên âm IPA</label><input ref={ipa} id="card-phienAm" className="input en" maxLength={100} value={values.phienAm} onChange={event => change('phienAm', event.target.value)} /><div className={styles.ipaKeys} aria-label="Chèn ký hiệu IPA">{IPA.map(char => <button type="button" key={char} aria-label={`Chèn ${char}`} onClick={() => insertIpa(char)}>{char}</button>)}</div>{errorFor('phienAm') && <p className="field-error">{errorFor('phienAm')}</p>}</div>
        {field('nghiaVi', 'Nghĩa tiếng Việt', 500, true, true)}
        <div className={`${styles.two} ${styles.even}`}>{field('viDuEn', 'Câu ví dụ tiếng Anh', 300, true, false, true)}{field('dichVi', 'Bản dịch ví dụ', 300, true)}</div>
        <fieldset className="fieldset field"><legend>Độ khó theo bạn</legend><div className="row">{['Dễ', 'Vừa', 'Khó', 'Rất khó', 'Thử thách'].map((label, index) => <label key={label} className="choice"><input type="radio" name="doKho" value={index + 1} checked={values.doKho === index + 1} onChange={() => change('doKho', index + 1)} /><span className="bubble" aria-hidden="true">{index + 1}</span><span>{label}</span></label>)}</div></fieldset>
        {field('nguon', 'Nguồn nội dung', 500, true)}
        <fieldset className="fieldset field"><legend>Nhãn</legend>{tags.isPending ? <p role="status">Đang tải nhãn…</p> : tags.error ? <ErrorState description={tags.error.message} onRetry={tags.refetch} /> : tags.data?.length === 0 ? <p className="muted">Chưa có nhãn để chọn.</p> : <div className="choice-grid cols-3">{tags.data?.map(tag => <label className="choice" key={tag.id}><input type="checkbox" checked={values.nhanIds.includes(tag.id)} onChange={event => change('nhanIds', event.target.checked ? [...values.nhanIds, tag.id] : values.nhanIds.filter(id => id !== tag.id))} /><span className="bubble box" aria-hidden="true"><Icon name="check" className="box-check" /></span><span>{tag.ten}</span></label>)}</div>}</fieldset>
        <p className="field-help">Không cần tải âm thanh: dùng giọng đọc tiếng Anh của trình duyệt. Tệp âm thanh riêng vẫn là tùy chọn.</p><div className="row"><SpeakButton text={values.tu} /><SpeakButton sentence text={values.viDuEn} /></div><div className={styles.media}>{[['anhId', 'Ảnh minh họa', 'ANH', 'ANH'], ['amTuId', 'Âm thanh từ', 'AM_THANH', 'AM_TU'], ['amCauId', 'Âm thanh câu', 'AM_THANH', 'AM_CAU']].map(([key, label, loai, role]) => <div key={key}><FileUpload label={label} loai={loai} value={values[key]} onChange={id => change(key, id)} onBusy={active => setBusy(count => count + (active ? 1 : -1))} disabled={pending} />{initial?.[key] && values[key] === initial[key] && <CardMedia deckId={deckId} cardId={initial.id} role={role} />}</div>)}</div>
      </fieldset>
      {save.error && <div role="alert"><p className="notice notice-error">{save.error.message}</p>{save.error.status === 409 && <button type="button" className="btn btn-secondary" onClick={() => { client.invalidateQueries({ queryKey: ['deck-cards', deckId] }); onCancel(); }}>Tải lại thẻ</button>}</div>}
      {saved && <p className="notice notice-success" role="status">Đã lưu thẻ{saved.trung ? '. Thẻ có thể trùng với thẻ đã có trong bộ.' : '.'}</p>}
      <div className={styles.foot}>{onCancel ? <button type="button" className="btn btn-quiet" disabled={pending} onClick={onCancel}>Hủy</button> : <Link className="btn btn-quiet" href={`/bo-the/${deckId}`}>Hủy</Link>}{!initial && <button className="btn btn-secondary" value="more" disabled={pending}>Lưu và thêm thẻ khác</button>}<button className="btn btn-primary btn-lg" disabled={pending} aria-busy={pending}>{pending ? 'Đang lưu…' : 'Lưu thẻ'}</button></div>
    </form>
    {!modal && <aside className="side-col"><h2 className="panel-title">Xem trước khi học</h2><div className={styles.face}><span className={styles.faceLabel}>Mặt trước, chiều Anh → Việt</span><p className="word" lang="en">{values.tu || 'receipt'}</p><p className="ipa">{values.phienAm} {values.tuLoai}</p></div><div className={styles.face}><span className={styles.faceLabel}>Mặt sau</span><p>{values.nghiaVi || 'Nghĩa tiếng Việt'}</p><p className="entry-example" lang="en">{values.viDuEn}</p><p className="muted">{values.dichVi}</p></div></aside>}
  </div>;
}
