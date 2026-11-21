'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { fetchAllPages } from '@/lib/fetch-all-pages';
import { cardPayload, normalizeTerm } from '@/lib/content-contract.mjs';
import { DICTIONARY_SOURCE } from '@/lib/dictionary.mjs';
import { Icon, Modal } from '@/components/ui';
import { SpeakButton } from '@/components/content/SpeakButton';
import { WordCombobox } from './WordCombobox';
import { SensePicker } from './SensePicker';
import { useDictionaryPick } from './useDictionaryPick';
import styles from './QuickAddCardDialog.module.css';

export const POS_OPTIONS = ['n.', 'v.', 'adj.', 'adv.', 'phr. v.', 'phr.', 'prep.', 'conj.'];
const LEVELS = ['Dễ', 'Vừa', 'Khó', 'Rất khó', 'Thử thách'];
const EMPTY = { tu: '', tuLoai: '', nghiaVi: '', phienAm: '', viDuEn: '', dichVi: '', doKho: 2, nguon: '', nhanIds: [] };

export function mergeDictionary(current, filled) {
  const next = { ...current, ...filled };
  if (filled.nguon && current.nguon && current.nguon !== DICTIONARY_SOURCE.cardNote) next.nguon = current.nguon;
  if (filled.phienAm === '') next.phienAm = current.phienAm;
  if (filled.tuLoai === '') next.tuLoai = current.tuLoai;
  return next;
}

export function QuickAddCardDialog({ deckId, deckName, onClose }) {
  const client = useQueryClient();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [added, setAdded] = useState([]);
  const [more, setMore] = useState(false);
  const wordRef = useRef(null);
  const closeAfter = useRef(false);
  const dict = useDictionaryPick(filled => setValues(current => mergeDictionary(current, filled)));
  useEffect(() => { const frame = requestAnimationFrame(() => wordRef.current?.focus()); return () => cancelAnimationFrame(frame); }, []);
  const existing = useQuery({ queryKey: ['deck-cards', deckId, 'editor'], queryFn: () => fetchAllPages(`/api/v1/decks/${deckId}/cards`) });

  const save = useMutation({
    mutationFn: body => apiFetch(`/api/v1/decks/${deckId}/cards`, { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: card => {
      client.invalidateQueries({ queryKey: ['deck-cards', deckId] });
      client.invalidateQueries({ queryKey: ['deck', deckId] });
      client.invalidateQueries({ queryKey: ['my-decks'] });
      if (closeAfter.current) { onClose(); return; }
      setAdded(list => [{ id: card.id, tu: card.tu, trung: card.trung }, ...list]);
      setValues(current => ({ ...EMPTY, doKho: current.doKho, nguon: current.nguon === DICTIONARY_SOURCE.cardNote ? '' : current.nguon }));
      setErrors({});
      dict.clear();
      requestAnimationFrame(() => wordRef.current?.focus());
    }
  });

  const change = (key, value) => { setValues(current => ({ ...current, [key]: value })); setErrors(current => ({ ...current, [key]: '' })); };
  const errorFor = key => errors[key] || save.error?.fieldErrors?.find(item => item.field === key)?.message;
  const duplicate = values.tu.trim() && (existing.data || []).concat(added).find(card => normalizeTerm(card.tu) === normalizeTerm(values.tu));

  const submit = close => {
    if (save.isPending) return;
    let body;
    try { body = cardPayload(values); }
    catch (error) { setErrors(Object.fromEntries(error.issues.map(issue => [issue.path[0], issue.message]))); (error.issues[0]?.path[0] === 'tu' ? wordRef.current : document.getElementById('qa-nghiaVi'))?.focus(); return; }
    closeAfter.current = close;
    save.mutate(body);
  };

  const onKeyDown = event => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); submit(false); }
  };

  return <Modal isOpen dismissible={false} onClose={onClose} loading={save.isPending} className={styles.modal} title={<span className={styles.title}>Thêm thẻ <span className={styles.deck}>vào “{deckName}”</span></span>} footer={<div className={styles.footer}>
    <Link className="btn btn-quiet btn-sm" href={`/bo-the/${deckId}/the-tao`}><Icon name="file" />Phiếu đầy đủ</Link>
    <span className={styles.spacer} />
    <button type="button" className="btn btn-secondary" disabled={save.isPending} onClick={() => submit(true)}>Lưu và đóng</button>
    <button type="submit" form="quick-add-card" className="btn btn-primary" disabled={save.isPending} aria-busy={save.isPending}>{save.isPending ? 'Đang lưu…' : <><Icon name="plus" />Lưu, thêm tiếp</>}</button>
  </div>}>
    <form id="quick-add-card" className={styles.form} noValidate onSubmit={event => { event.preventDefault(); submit(false); }} onKeyDown={onKeyDown}>
      {added.length > 0 && <div className={styles.added} role="status">
        <span className={styles.addedLabel}><Icon name="check" />Đã thêm {added.length} thẻ:</span>
        {added.slice(0, 8).map(card => <span key={card.id} className={styles.addedChip} lang="en">{card.tu}</span>)}
        {added.length > 8 && <span className="small muted">+{added.length - 8}</span>}
      </div>}

      <div className="field">
        <label className="field-label" htmlFor="qa-tu">Từ cần học</label>
        <div className={styles.wordRow}>
          <div className={styles.grow}>
            <WordCombobox id="qa-tu" inputRef={wordRef} autoFocus value={values.tu} onChange={value => change('tu', value)} onPick={dict.pick} invalid={!!errorFor('tu')} describedBy="qa-tu-help" />
          </div>
          <SpeakButton text={values.tu} compact />
        </div>
        <p id="qa-tu-help" className="field-hint">Gõ tiếng Anh (vd. <i lang="en">environment</i>) hoặc tiếng Việt (vd. <i>môi trường</i>), rồi chọn gợi ý để tự điền.</p>
        {errorFor('tu') && <p className="field-error" role="alert">{errorFor('tu')}</p>}
      </div>

      {dict.picked && <SensePicker picked={dict.picked} onChoose={dict.choose} onClose={dict.clear} />}

      {duplicate && <p className="notice notice-warning" role="status">Bộ đã có “{duplicate.tu}”. Vẫn lưu được nếu đây là nghĩa khác.</p>}

      <div className={styles.meta}>
        <div className="field">
          <label className="field-label" htmlFor="qa-phienAm">Phiên âm</label>
          <input id="qa-phienAm" className="input en" lang="en" maxLength={100} value={values.phienAm} onChange={event => change('phienAm', event.target.value)} />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="qa-tuLoai">Từ loại</label>
          <select id="qa-tuLoai" className="select" value={values.tuLoai} onChange={event => change('tuLoai', event.target.value)}>
            <option value="">Không ghi</option>
            {POS_OPTIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
            {values.tuLoai && !POS_OPTIONS.includes(values.tuLoai) && <option>{values.tuLoai}</option>}
          </select>
        </div>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="qa-nghiaVi">Nghĩa tiếng Việt</label>
        <textarea id="qa-nghiaVi" className="textarea" rows={2} maxLength={500} required value={values.nghiaVi} onChange={event => change('nghiaVi', event.target.value)} aria-invalid={!!errorFor('nghiaVi')} />
        {errorFor('nghiaVi') && <p className="field-error" role="alert">{errorFor('nghiaVi')}</p>}
      </div>

      <div className={styles.two}>
        <div className="field">
          <label className="field-label" htmlFor="qa-viDuEn">Câu ví dụ<span className="optional">Không bắt buộc</span></label>
          <textarea id="qa-viDuEn" className="textarea en" lang="en" rows={2} maxLength={300} value={values.viDuEn} onChange={event => change('viDuEn', event.target.value)} />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="qa-dichVi">Bản dịch<span className="optional">Không bắt buộc</span></label>
          <textarea id="qa-dichVi" className="textarea" rows={2} maxLength={300} value={values.dichVi} onChange={event => change('dichVi', event.target.value)} />
        </div>
      </div>

      <div className={styles.more}>
        <button type="button" className="link-btn" aria-expanded={more} onClick={() => setMore(v => !v)}>{more ? 'Ẩn tùy chọn' : 'Độ khó và nguồn'}</button>
        {!more && <span className="small muted">Độ khó: {LEVELS[values.doKho - 1]}{values.nguon && ` · Nguồn: ${values.nguon}`}</span>}
      </div>
      {more && <div className={styles.extra}>
        <fieldset className="fieldset field">
          <legend>Độ khó theo bạn</legend>
          <div className={styles.levels}>{LEVELS.map((label, index) => <label key={label} className="choice"><input type="radio" name="qa-doKho" checked={values.doKho === index + 1} onChange={() => change('doKho', index + 1)} /><span className="bubble" aria-hidden="true">{index + 1}</span><span>{label}</span></label>)}</div>
        </fieldset>
        <div className="field">
          <label className="field-label" htmlFor="qa-nguon">Nguồn nội dung<span className="optional">Không bắt buộc</span></label>
          <input id="qa-nguon" className="input" maxLength={500} value={values.nguon} onChange={event => change('nguon', event.target.value)} />
        </div>
      </div>}

      {save.error && !save.error.fieldErrors?.length && <p className="notice notice-danger" role="alert">{save.error.message}</p>}
      <p className={styles.shortcut} aria-hidden="true"><kbd>Ctrl</kbd>+<kbd>Enter</kbd> lưu và thêm tiếp</p>
    </form>
  </Modal>;
}
