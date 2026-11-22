'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAiRequest } from '@/hooks/useAiRequest';
import { useMe } from '@/hooks/useMe';
import { apiFetch } from '@/lib/api-client';
import { fetchAllPages } from '@/lib/fetch-all-pages';
import { draftCommit, AI_STATUS } from '@/lib/remote-contract.mjs';
import { RemoteState } from '@/components/remote/Remote';
import { Icon } from '@/components/ui';
import { GuardedAction, QuotaMeter } from '@/components/billing/PlanAccess';
import styles from './page.module.css';

export default function AiCardWorkshopPage() {
  const [passage, setPassage] = useState('');
  const [deck, setDeck] = useState('');
  const [cards, setCards] = useState([]);
  const [status, setStatus] = useState('');
  const request = useAiRequest();
  const isGenerating = request.busy;
  const client = useQueryClient();
  const { data: user } = useMe();
  const decks = useQuery({ queryKey: ['all-my-decks'], queryFn: () => fetchAllPages('/api/v1/decks') });
  const [saving, setSaving] = useState(false);
  const [attempt, setAttempt] = useState(null);
  const seeded = useRef(null);
  useEffect(() => { const id = new URLSearchParams(window.location.search).get('requestId'); if (id && /^[1-9][0-9]*$/.test(id)) request.resume(id); }, [request.resume]);
  useEffect(() => { if (request.id) { const url = new URL(window.location.href); url.searchParams.set('requestId', request.id); window.history.replaceState(null, '', url); } }, [request.id]);
  const storageKey = user?.id && request.id ? `vocab:ai-commit:${user.id}:${request.id}` : null;
  useEffect(() => {
    if (!storageKey || request.data?.trangThai !== 'HOAN_TAT' || seeded.current === request.id) return;
    seeded.current = request.id;
    setCards((request.data.banNhap || []).map(c => ({ id:c.id, word:c.tu, part:c.tuLoai, meaning:c.nghiaVi, sentence:c.viDuEn, translation:c.dichVi, duplicate:c.trung, selected:!c.trung && c.trangThaiDuyet==='CHO_DUYET', saved:c.trangThaiDuyet==='DA_LUU' })));
    if (storageKey) { try { const saved = JSON.parse(sessionStorage.getItem(storageKey)); if (typeof saved?.key === 'string' && Array.isArray(saved.body?.banNhapIds) && Array.isArray(saved.body?.sua) && typeof saved.body.boTheId === 'string') {
      setAttempt(saved); setDeck(saved.body.boTheId);
      setCards(current => current.map(card => { const edit = saved.body.sua.find(row => row.banNhapId === card.id); return { ...card, selected:saved.body.banNhapIds.includes(card.id), ...(edit ? {word:edit.tu,meaning:edit.nghiaVi,part:edit.tuLoai,sentence:edit.viDuEn,translation:edit.dichVi} : {}) }; }));
    } } catch {} }
  }, [request.data, request.id, storageKey]);
  const [isSaved, setIsSaved] = useState(false);

  const selectedCount = cards.filter(card => card.selected).length;

  const generateDraft = event => {
    event.preventDefault();
    if (attempt || saving) return;
    setIsSaved(false); setCards([]); setStatus('');
    request.start('/api/v1/ai/card-drafts', { doanVan: passage.trim(), boTheId: deck || null });
  };
  const toggleCard = (index) => {
    if (attempt || saving) return;
    setCards(current => current.map((card, cardIndex) => (
      cardIndex === index ? { ...card, selected: !card.selected } : card
    )));
    setIsSaved(false);
  };

  const updateCard = (index, field, value) => {
    if (attempt || saving) return;
    setCards(current => current.map((card, cardIndex) => (
      cardIndex === index ? { ...card, [field]: value } : card
    )));
    setIsSaved(false);
  };

  const saveCards = async () => {
    if (saving || isSaved) return;
    setSaving(true); setStatus('');
    try {
      const submission = attempt || { key: crypto.randomUUID(), body: draftCommit(cards, deck) };
      if (!attempt) {
        if (!storageKey) throw new Error('Chưa xác định được tài khoản hoặc yêu cầu AI.');
        sessionStorage.setItem(storageKey, JSON.stringify(submission));
        setAttempt(submission);
      }
      const result = await apiFetch(`/api/v1/ai/card-drafts/${request.id}/commit`, { method:'POST', headers:{'Idempotency-Key':submission.key}, body:JSON.stringify(submission.body) });
      setIsSaved(true); setStatus(`Đã lưu ${result.soTheDaLuu} thẻ vào bộ thẻ.`);
      await Promise.all([client.invalidateQueries({queryKey:['my-decks']}),client.invalidateQueries({queryKey:['all-my-decks']}),client.invalidateQueries({queryKey:['deck',result.boTheId]})]);
    } catch(error) {
      if ([400, 422].includes(error.status)) { try { sessionStorage.removeItem(storageKey); } catch {} setAttempt(null); }
      setStatus(error.message);
    }
    finally { setSaving(false); }
  };
  const speak = (text) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
    }
  };

  return (
    <div className={`page ${styles.page}`}>
      <div className={styles.demoBar}>
        <span>AI tạo thẻ nháp để bạn duyệt</span>
        <Link href="/ai-lich-su">Lịch sử AI</Link>
      </div>

      <article className="sheet" aria-labelledby="page-title">
        <nav className={styles.breadcrumb} aria-label="Đường dẫn">
          <Link href="/hom-nay">Hôm nay</Link>
          <span aria-hidden="true">/</span>
          <span>Xưởng thẻ AI</span>
        </nav>

        <div className="form-head">
          <div className="form-code">
            <span>Học và mở rộng</span>
            <span>AI</span>
          </div>
          <h1 id="page-title">Xưởng thẻ AI</h1>
          <p>Từ một đoạn văn đến thẻ nháp bạn đã kiểm tra.</p>
        </div>
        <QuotaMeter feature="AI" />

        <p className={styles.status} role="status" aria-live="polite">{status || request.error || (request.data ? `${AI_STATUS[request.data.trangThai]}${request.data.moPhong ? " · Nhà cung cấp mô phỏng" : ""}` : "")}</p>

        <RemoteState queries={[decks]}><div className={styles.workspace}>
          <form className={styles.form} onSubmit={generateDraft}>
            <div className="field">
              <label className="field-label" htmlFor="passage">Đoạn văn tiếng Anh</label>
              <textarea
                className="textarea"
                id="passage"
                value={passage}
                onChange={event => setPassage(event.target.value)}
                maxLength={5000}
                required
                rows={7}
              />
              <p className="field-hint">Tối đa 5.000 ký tự. Số thẻ phụ thuộc nội dung và kết quả từ dịch vụ AI.</p>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="deck">Bộ thẻ nhận bản nháp</label>
              <select className="select" id="deck" required disabled={!!attempt || saving || isGenerating} value={deck} onChange={event => setDeck(event.target.value)}>
                <option value="">Chọn bộ thẻ</option>
                {decks.data?.map(d => <option key={d.id} value={d.id}>{d.ten}</option>)}
              </select>
            </div>

            <GuardedAction feature="AI" className="btn btn-primary" type="submit" disabled={isGenerating || !!attempt || saving}>
              {isGenerating ? 'Đang tạo bản nháp…' : 'Tạo bản nháp'}
            </GuardedAction>
            <p className="muted small">Nội dung gốc không bị thay đổi. Thẻ chưa được lưu tự động.</p>
            <Link className="btn btn-quiet" href="/ai-lich-su">Lịch sử và hạn mức</Link>
            {isSaved && <button type="button" className="btn btn-secondary" onClick={() => { request.resume(null); seeded.current=null; setAttempt(null); setIsSaved(false); setCards([]); setStatus(''); const url=new URL(window.location.href); url.searchParams.delete('requestId'); window.history.replaceState(null,'',url); }}>Tạo lượt mới</button>}
          </form>

          <section className={styles.output} aria-labelledby="output-title" tabIndex="-1">
            {!cards.length ? (
              <div className="empty">
                <h2 id="output-title">Thẻ nháp sẽ nằm ở đây</h2>
                <p>Gửi một đoạn văn để AI đề xuất từ vựng, nghĩa và câu ví dụ.</p>
              </div>
            ) : (
              <>
                <div className={styles.notice}>
                  <Icon name="info" />
                  <span>Kiểm tra nội dung trước khi lưu. Thẻ có thể trùng được bỏ chọn mặc định.</span>
                </div>
                <div className={styles.drafts}>
                  {cards.map((card, index) => (
                    <article className={`${styles.card} ${card.selected ? styles.selected : ''}`} key={card.id}>
                      <label className="choice">
                        <input type="checkbox" disabled={!!attempt || saving || card.saved} checked={card.selected} onChange={() => toggleCard(index)} />
                        <span className="bubble" aria-hidden="true"></span>
                        <span>Chọn thẻ {index + 1}</span>
                      </label>
                      <div className={styles.cardFields}>
                        <div className="field">
                          <label className="field-label" htmlFor={`word-${index}`}>Từ tiếng Anh</label>
                          <input className="input" id={`word-${index}`} maxLength={100} disabled={!!attempt || saving} value={card.word} onChange={event => updateCard(index, 'word', event.target.value)} />
                        </div>
                        <div className="field">
                          <label className="field-label" htmlFor={`meaning-${index}`}>Nghĩa tiếng Việt</label>
                          <textarea className="textarea" id={`meaning-${index}`} maxLength={500} disabled={!!attempt || saving} value={card.meaning} onChange={event => updateCard(index, 'meaning', event.target.value)} rows={2} />
                        </div>
                      </div>
                      <p className={styles.sentence} lang="en">{card.sentence}</p>
                      {card.duplicate && <span className="stamp stamp-warning">Có thể trùng · chưa được chọn</span>}
                      <div className={styles.actions}>
                        <button className="btn btn-edit btn-sm" type="button" onClick={() => document.getElementById(`word-${index}`)?.focus()}><Icon name="edit" />Sửa bản nháp</button>
                        <button className="btn btn-media btn-sm" type="button" onClick={() => speak(card.word)}><Icon name="volume" />Đọc từ</button>
                      </div>
                    </article>
                  ))}
                </div>
                <div className={styles.footer}>
                  <span>{selectedCount} thẻ đang chọn</span>
                  <button className="btn btn-primary" type="button" disabled={(!selectedCount && !attempt) || isSaved || saving} onClick={saveCards}>
                    {saving ? 'Đang lưu…' : isSaved ? 'Đã lưu thẻ' : attempt ? 'Thử lại yêu cầu lưu' : `Lưu ${selectedCount} thẻ đã chọn`}
                  </button>
                </div>
              </>
            )}
          </section>
        </div></RemoteState>
      </article>
    </div>
  );
}
