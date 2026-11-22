'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { fetchAllPages } from '@/lib/fetch-all-pages';
import { cardPayload } from '@/lib/content-contract.mjs';
import { Modal } from '@/components/ui';
import styles from './AddToDeckDialog.module.css';

const BASE = { doKho: 2, nhanIds: [] };

export function AddToDeckDialog({ card, onClose }) {
  const client = useQueryClient();
  const [deckId, setDeckId] = useState('');
  const [values, setValues] = useState(card);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);
  const decks = useQuery({ queryKey: ['my-decks', 'all'], queryFn: () => fetchAllPages('/api/v1/decks'), enabled: !!card });
  const selected = deckId || decks.data?.[0]?.id || '';
  const save = useMutation({
    mutationFn: ({ id, body }) => apiFetch(`/api/v1/decks/${id}/cards`, { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: (saved, { id }) => {
      client.invalidateQueries({ queryKey: ['deck-cards', id] });
      client.invalidateQueries({ queryKey: ['deck', id] });
      client.invalidateQueries({ queryKey: ['my-decks'] });
      setDone({ deckId: id, trung: saved?.trung });
    },
    onError: err => setError(err.message || 'Chưa lưu được thẻ')
  });
  const submit = event => {
    event.preventDefault();
    setError('');
    let body;
    try { body = cardPayload({ ...BASE, ...values }); }
    catch (err) { setError(err.issues?.[0]?.message || 'Thẻ chưa hợp lệ'); return; }
    save.mutate({ id: selected, body });
  };
  const change = (key, value) => setValues(current => ({ ...current, [key]: value }));
  const deckName = decks.data?.find(deck => deck.id === done?.deckId)?.ten;
  return <Modal isOpen={!!card} onClose={onClose} loading={save.isPending} title={done ? 'Đã tạo thẻ' : 'Tạo thẻ từ từ điển'} footer={done
    ? <><button type="button" className="btn btn-quiet" onClick={onClose}>Đóng</button><Link className="btn btn-primary" href={`/bo-the/${done.deckId}`}>Mở bộ thẻ</Link></>
    : <><button type="button" className="btn btn-quiet" onClick={onClose} disabled={save.isPending}>Hủy</button><button type="submit" form="dict-add-form" className="btn btn-primary" disabled={save.isPending || !selected} aria-busy={save.isPending}>{save.isPending ? 'Đang lưu…' : 'Lưu thẻ'}</button></>}>
    {card && (done
      ? <p className="notice notice-success" role="status">Đã thêm “{values.tu}” vào {deckName ? `bộ “${deckName}”` : 'bộ thẻ'}{done.trung ? '. Bộ đã có thẻ gần giống.' : '.'}</p>
      : <form id="dict-add-form" className={styles.form} onSubmit={submit}>
        <div className="field">
          <label className="field-label" htmlFor="dict-deck">Thêm vào bộ</label>
          {decks.isPending ? <p role="status" className="muted">Đang tải bộ thẻ…</p>
            : decks.data?.length ? <select id="dict-deck" className="select" value={selected} onChange={event => setDeckId(event.target.value)}>
              {decks.data.map(deck => <option key={deck.id} value={deck.id}>{deck.ten}</option>)}
            </select>
              : <p className="notice notice-warning">Bạn chưa có bộ thẻ nào. <Link href="/bo-the/tao">Tạo bộ mới</Link></p>}
        </div>
        <div className={styles.preview}>
          <p className={styles.word} lang="en">{values.tu} <span className="entry-ipa">{values.phienAm}</span> {values.tuLoai && <span className="pos">{values.tuLoai}</span>}</p>
          <div className="field">
            <label className="field-label" htmlFor="dict-nghia">Nghĩa tiếng Việt</label>
            <textarea id="dict-nghia" className="textarea" rows={2} maxLength={500} value={values.nghiaVi} onChange={event => change('nghiaVi', event.target.value)} />
          </div>
          <div className={styles.two}>
            <div className="field">
              <label className="field-label" htmlFor="dict-vidu">Câu ví dụ<span className="optional">Không bắt buộc</span></label>
              <textarea id="dict-vidu" className="textarea en" lang="en" rows={2} maxLength={300} value={values.viDuEn} onChange={event => change('viDuEn', event.target.value)} />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="dict-dich">Bản dịch<span className="optional">Không bắt buộc</span></label>
              <textarea id="dict-dich" className="textarea" rows={2} maxLength={300} value={values.dichVi} onChange={event => change('dichVi', event.target.value)} />
            </div>
          </div>
          <p className="small muted">Nguồn ghi trên thẻ: {values.nguon}</p>
        </div>
        {error && <p className="notice notice-danger" role="alert">{error}</p>}
      </form>)}
  </Modal>;
}
