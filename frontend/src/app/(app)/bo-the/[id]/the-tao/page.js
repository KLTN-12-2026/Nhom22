'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input, Select, Textarea, Icon } from '@/components/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { useDeck } from '@/hooks/useDeck';

const IPA_CHARS = ["ə", "ɪ", "iː", "æ", "ʌ", "ɑː", "ɒ", "ɔː", "ʊ", "uː", "ɜː", "eɪ", "aɪ", "ɔɪ", "aʊ", "oʊ", "θ", "ð", "ʃ", "ʒ", "tʃ", "dʒ", "ŋ", "ˈ", "ˌ", "ː"];

export default function AddCardPage({ params }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const deckId = params.id;
  
  const { data: deck } = useDeck(deckId);

  const [word, setWord] = useState('');
  const [pos, setPos] = useState('');
  const [ipa, setIpa] = useState('');
  const [meaningVi, setMeaningVi] = useState('');
  const [exampleEn, setExampleEn] = useState('');
  const [exampleVi, setExampleVi] = useState('');
  const [difficulty, setDifficulty] = useState(2);

  const ipaInputRef = useRef(null);

  const insertIpa = (char) => {
    const el = ipaInputRef.current;
    if (!el) {
      setIpa(prev => prev + char);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newIpa = ipa.slice(0, start) + char + ipa.slice(end);
    setIpa(newIpa);
    
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + char.length, start + char.length);
    }, 0);
  };

  const addCardMutation = useMutation({
    mutationFn: (data) => apiFetch(`/api/v1/decks/${deckId}/cards`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deck', deckId] });
    }
  });

  const handleSubmit = (e, more = false) => {
    e.preventDefault();
    addCardMutation.mutate({ word, pos, ipa, meaningVi, exampleEn, exampleVi, difficulty }, {
      onSuccess: () => {
        if (more) {
          alert('Đã lưu thẻ! Bạn có thể thêm thẻ tiếp theo.');
          setWord(''); setPos(''); setIpa(''); setMeaningVi(''); setExampleEn(''); setExampleVi('');
        } else {
          router.push(`/bo-the/${deckId}`);
        }
      },
      onError: (err) => alert(err.message || 'Lỗi khi lưu thẻ')
    });
  };

  return (
    <div style={{ display: 'grid', gap: 'var(--space-5)', gridTemplateColumns: '1fr', alignItems: 'start' }}>
      <section className="sheet" style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', marginBottom: 'var(--space-2)' }}>
            <span>Phiếu thêm thẻ</span>
            <span>{deck?.cardCount || 0} thẻ trong bộ</span>
          </div>
          <Link href={`/bo-the/${deckId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--color-ink-2)', textDecoration: 'none', marginBottom: 'var(--space-2)' }}>
            <Icon name="arrow-left" /> <span>{deck?.name || 'Bộ thẻ'}</span>
          </Link>
          <h1 style={{ fontSize: 'var(--font-size-3xl)' }}>Thêm thẻ</h1>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          
          <div style={{ display: 'grid', gap: 'var(--space-4)', gridTemplateColumns: '2fr 1fr' }}>
            <Input 
              label="Từ hoặc cụm từ tiếng Anh" 
              placeholder="receipt" 
              value={word} onChange={e => setWord(e.target.value)} 
              required 
              maxLength={110}
            />
            <Select 
              label="Từ loại" 
              value={pos} onChange={e => setPos(e.target.value)} 
              options={[
                { value: '', label: 'Không ghi' },
                { value: 'n.', label: 'Danh từ (n.)' },
                { value: 'v.', label: 'Động từ (v.)' },
                { value: 'adj.', label: 'Tính từ (adj.)' },
                { value: 'adv.', label: 'Trạng từ (adv.)' },
                { value: 'phr. v.', label: 'Cụm động từ (phr. v.)' },
                { value: 'phr.', label: 'Cụm từ (phr.)' }
              ]}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label style={{ fontWeight: 'bold', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-1)', display: 'block' }}>Phiên âm IPA</label>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-ink-3)' }}>Không bắt buộc</span>
            </div>
            <input 
              ref={ipaInputRef}
              type="text"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-word)', fontSize: 'var(--font-size-lg)' }}
              placeholder="/rɪˈsiːt/"
              value={ipa}
              onChange={e => setIpa(e.target.value)}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
              {IPA_CHARS.map(char => (
                <button 
                  key={char} type="button" 
                  onClick={() => insertIpa(char)}
                  style={{ minWidth: '36px', height: '36px', background: 'var(--color-field)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontFamily: 'var(--font-word)', fontSize: '1.0625rem' }}
                >
                  {char}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Textarea 
              label="Nghĩa tiếng Việt" 
              placeholder="biên lai, giấy biên nhận" 
              value={meaningVi} onChange={e => setMeaningVi(e.target.value)} 
              required 
              rows={2}
              maxLength={520}
            />
            <p style={{ textAlign: 'right', fontSize: 'var(--font-size-xs)', color: meaningVi.length > 500 ? 'var(--color-danger)' : 'var(--color-ink-3)' }}>{meaningVi.length}/500</p>
          </div>

          <div style={{ display: 'grid', gap: 'var(--space-4)', gridTemplateColumns: '1fr 1fr' }}>
            <Textarea 
              label={<div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Câu ví dụ tiếng Anh</span><span style={{ color: 'var(--color-ink-3)', fontWeight: 'normal' }}>Không bắt buộc</span></div>}
              placeholder="Keep the receipt in case you need a refund."
              value={exampleEn} onChange={e => setExampleEn(e.target.value)}
              rows={3}
            />
            <Textarea 
              label={<div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Bản dịch ví dụ</span><span style={{ color: 'var(--color-ink-3)', fontWeight: 'normal' }}>Không bắt buộc</span></div>}
              placeholder="Giữ lại biên lai phòng khi bạn cần hoàn tiền."
              value={exampleVi} onChange={e => setExampleVi(e.target.value)}
              rows={3}
            />
          </div>

          <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
            <legend style={{ fontWeight: 'bold', marginBottom: 'var(--space-2)' }}>Độ khó theo bạn</legend>
            <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
              {[
                { val: 1, label: 'Dễ' },
                { val: 2, label: 'Vừa' },
                { val: 3, label: 'Khó' }
              ].map(opt => (
                <label key={opt.val} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="radio" name="difficulty" value={opt.val} checked={difficulty === opt.val} onChange={() => setDifficulty(opt.val)} />
                  <span style={{ background: 'var(--color-ink-3)', color: 'white', width: '24px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '12px' }}>{opt.val}</span>
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 'var(--space-2)', paddingTop: 'var(--space-5)', borderTop: '2px solid var(--color-primary-tint)' }}>
            <Link href={`/bo-the/${deckId}`}><Button variant="ghost" type="button">Hủy</Button></Link>
            <Button variant="secondary" type="button" onClick={(e) => handleSubmit(e, true)} disabled={addCardMutation.isPending}>Lưu và thêm thẻ khác</Button>
            <Button variant="primary" size="lg" type="submit" disabled={addCardMutation.isPending}>Lưu thẻ</Button>
          </div>
        </form>
      </section>
    </div>
  );
}
