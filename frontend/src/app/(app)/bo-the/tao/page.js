'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { useTopics } from '@/hooks/useTopics';
import { Icon } from '@/components/ui';
import styles from './page.module.css';

export default function CreateDeckPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: topics = [] } = useTopics();
  
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [goal, setGoal] = useState('GIAO_TIEP');
  const [topicId, setTopicId] = useState('');
  const [level, setLevel] = useState('MOI_BAT_DAU');
  const [visibility, setVisibility] = useState('RIENG_TU');

  const createMutation = useMutation({
    mutationFn: (data) => apiFetch('/api/v1/decks', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['my-decks'] });
      router.push(`/bo-the/${res.id}`);
    },
    onError: (err) => {
      alert(err.message || 'Lỗi khi tạo bộ thẻ');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      name, description: desc, goal, topicId, level, visibility
    });
  };

  const currentTopic = topics.find(t => t.id === topicId);
  const GOAL_LABEL = { GIAO_TIEP: 'Giao tiếp', TOEIC: 'TOEIC' };
  const LEVEL_LABEL = { MOI_BAT_DAU: 'Mới bắt đầu', CO_BAN: 'Cơ bản', TRUNG_CAP: 'Trung cấp', NANG_CAO: 'Nâng cao' };

  return (
    <div className="page page-grid with-side" data-view="ready">
      <section className="sheet" aria-labelledby="page-title">
        <div className="form-head">
          <div className="form-code"><span id="mode-code">Phiếu tạo bộ thẻ</span></div>
          <Link className="btn btn-quiet" id="back" href="/bo-the" style={{ margin: '0 0 var(--sp-2) -12px', justifySelf: 'start' }}>
            <Icon name="arrow-left" /><span>Bộ của tôi</span>
          </Link>
          <h1 id="page-title">Tạo bộ thẻ</h1>
        </div>

        <form id="form" className={styles.formGrid} onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label className="field-label" htmlFor="name">Tên bộ thẻ</label>
            <input 
              className="input" 
              id="name" 
              name="name" 
              maxLength="160" 
              required 
              placeholder="Ví dụ: TOEIC Part 5 — từ hay sai"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <p className="field-counter" id="name-count" aria-live="polite" data-over={name.length > 150 ? "" : undefined}>
              {name.length}/150
            </p>
            <p className="field-error"></p>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="description">
              <span>Mô tả</span><span className="optional">Không bắt buộc</span>
            </label>
            <textarea 
              className="textarea" 
              id="description" 
              name="description" 
              maxLength="1000" 
              placeholder="Bộ này dùng để làm gì, lấy từ đâu"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
            <p className="field-error"></p>
          </div>

          <fieldset className="fieldset field" data-field="goal">
            <legend>Mục tiêu</legend>
            <div className="choice-grid cols-2">
              <label className="choice choice-card">
                <input type="radio" name="goal" value="GIAO_TIEP" checked={goal === 'GIAO_TIEP'} onChange={() => setGoal('GIAO_TIEP')} />
                <span className="bubble" aria-hidden="true">A</span>
                <span className="choice-body"><span className="choice-title">Giao tiếp</span></span>
              </label>
              <label className="choice choice-card">
                <input type="radio" name="goal" value="TOEIC" checked={goal === 'TOEIC'} onChange={() => setGoal('TOEIC')} />
                <span className="bubble" aria-hidden="true">B</span>
                <span className="choice-body"><span className="choice-title">TOEIC</span></span>
              </label>
            </div>
            <p className="field-error"></p>
          </fieldset>

          <div className="field">
            <label className="field-label" htmlFor="topicId">Chủ đề</label>
            <select className="select" id="topicId" name="topicId" required value={topicId} onChange={(e) => setTopicId(e.target.value)}>
              <option value="">Chọn chủ đề</option>
              {topics.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <p className="field-error"></p>
          </div>

          <fieldset className="fieldset field" data-field="level">
            <legend>Trình độ</legend>
            <div className="choice-grid cols-2">
              <label className="choice">
                <input type="radio" name="level" value="MOI_BAT_DAU" checked={level === 'MOI_BAT_DAU'} onChange={() => setLevel('MOI_BAT_DAU')} />
                <span className="bubble" aria-hidden="true">A</span>
                <span className="choice-body"><span className="choice-title">Mới bắt đầu</span></span>
              </label>
              <label className="choice">
                <input type="radio" name="level" value="CO_BAN" checked={level === 'CO_BAN'} onChange={() => setLevel('CO_BAN')} />
                <span className="bubble" aria-hidden="true">B</span>
                <span className="choice-body"><span className="choice-title">Cơ bản</span></span>
              </label>
              <label className="choice">
                <input type="radio" name="level" value="TRUNG_CAP" checked={level === 'TRUNG_CAP'} onChange={() => setLevel('TRUNG_CAP')} />
                <span className="bubble" aria-hidden="true">C</span>
                <span className="choice-body"><span className="choice-title">Trung cấp</span></span>
              </label>
              <label className="choice">
                <input type="radio" name="level" value="NANG_CAO" checked={level === 'NANG_CAO'} onChange={() => setLevel('NANG_CAO')} />
                <span className="bubble" aria-hidden="true">D</span>
                <span className="choice-body"><span className="choice-title">Nâng cao</span></span>
              </label>
            </div>
            <p className="field-error"></p>
          </fieldset>

          <fieldset className="fieldset field" data-field="visibility">
            <legend>Ai xem được bộ này?</legend>
            <div className="choice-grid">
              <label className="choice choice-card">
                <input type="radio" name="visibility" value="RIENG_TU" checked={visibility === 'RIENG_TU'} onChange={() => setVisibility('RIENG_TU')} />
                <span className="bubble" aria-hidden="true">A</span>
                <span className="choice-body">
                  <span className="choice-title">Riêng tư</span>
                  <span className="choice-desc">Chỉ bạn thấy. Không xuất hiện trong thư viện.</span>
                </span>
              </label>
              <label className="choice choice-card">
                <input type="radio" name="visibility" value="CONG_KHAI" checked={visibility === 'CONG_KHAI'} onChange={() => setVisibility('CONG_KHAI')} />
                <span className="bubble" aria-hidden="true">B</span>
                <span className="choice-body">
                  <span className="choice-title">Công khai</span>
                  <span className="choice-desc">Hiện trong thư viện với nhãn “Người học chia sẻ”. Người khác sao chép được nội dung, không thấy tiến độ học của bạn.</span>
                </span>
              </label>
            </div>
          </fieldset>

          <div className={styles.formFoot}>
            <div className={styles.row}>
              <Link className="btn btn-quiet" id="cancel" href="/bo-the">Hủy</Link>
              <button type="submit" className="btn btn-primary btn-lg" id="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Đang tạo...' : 'Tạo bộ thẻ'}
              </button>
            </div>
          </div>
        </form>
      </section>

      <aside className="side-col" data-when="ready">
        <section className="panel" aria-labelledby="pv-title">
          <h2 className="panel-title" id="pv-title">Xem trước trong danh sách</h2>
          <ol className={`answer-list ${styles.previewRow}`} role="list">
            <li className="answer-row">
              <span className="answer-no">1</span>
              <div className="answer-main">
                <span className="answer-title" id="pv-name" style={{ position: 'static' }}>
                  {name.trim() || 'Tên bộ thẻ'}
                </span>
                <div className="answer-meta" id="pv-meta">
                  {visibility === 'CONG_KHAI' ? (
                    <span className="stamp stamp-quiet"><Icon name="globe" />Công khai</span>
                  ) : (
                    <span className="stamp stamp-quiet"><Icon name="lock" />Riêng tư</span>
                  )}
                  {goal && <span>{GOAL_LABEL[goal]}</span>}
                  {currentTopic && <span>{currentTopic.name}</span>}
                  {level && (
                    <span className="level" title="Trình độ tự đánh giá">
                      <span className="bubble-row" aria-hidden="true">
                        {[1, 2, 3, 4].map(n => {
                          const lvlMap = { MOI_BAT_DAU: 1, CO_BAN: 2, TRUNG_CAP: 3, NANG_CAO: 4 };
                          return <span key={n} className={`bubble${lvlMap[level] >= n ? ' is-filled' : ''}`}></span>;
                        })}
                      </span>
                      {LEVEL_LABEL[level]}
                    </span>
                  )}
                </div>
              </div>
            </li>
          </ol>
        </section>
      </aside>
    </div>
  );
}
