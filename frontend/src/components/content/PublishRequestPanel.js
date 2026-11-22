'use client';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { ErrorState, Icon, Modal } from '@/components/ui';
import { CopyChanges } from '@/components/content/CopyChanges';
import { copyChanges, summarize } from '@/lib/copy-diff.mjs';
import {
  APPROVER, PUBLISH_REASON, PUBLISH_STAMP, PUBLISH_STATUS, canResubmit, formatTime, reasonOf,
  submitPublishRequest, withdrawPublishRequest,
} from '@/lib/publish-requests.mjs';
import styles from './PublishRequestPanel.module.css';

const STOPPED = { TU_CHOI: 'bad', THU_HOI: 'bad', HET_HAN: 'mute', DA_RUT: 'mute' };

function daysLeft(iso) {
  const ms = Date.parse(iso) - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return '';
  const days = Math.floor(ms / 86400000);
  if (days >= 1) return `còn ${days} ngày`;
  const hours = Math.max(1, Math.floor(ms / 3600000));
  return `còn ${hours} giờ`;
}

function Steps({ status }) {
  const state = status.trangThai;
  const stopped = STOPPED[state];
  const steps = [
    { key: 'sent', label: 'Đã gửi', state: 'done' },
    { key: 'review', label: stopped ? PUBLISH_STATUS[state] : 'Chờ duyệt', state: state === 'CHO_DUYET' ? 'current' : stopped ? stopped : 'done' },
    { key: 'public', label: 'Công khai', state: state === 'DA_DUYET' ? 'done' : 'todo' },
  ];
  return (
    <ol className={styles.steps} aria-label="Tiến trình yêu cầu">
      {steps.map((step, index) => (
        <li key={step.key} className={styles.step} data-state={step.state} aria-current={step.state === 'current' ? 'step' : undefined}>
          <span className={styles.dot} aria-hidden="true">
            {step.state === 'done' ? <Icon name="check" /> : step.state === 'bad' ? <Icon name="x" /> : index + 1}
          </span>
          <span className={styles.stepLabel}>{step.label}</span>
        </li>
      ))}
    </ol>
  );
}

export function PublishRequestPanel({ deck }) {
  const client = useQueryClient();
  const [loiNhan, setLoiNhan] = useState('');
  const [message, setMessage] = useState('');
  const [showChanges, setShowChanges] = useState(false);
  const status = deck.yeuCauCongKhai;
  const refresh = () => {
    client.invalidateQueries({ queryKey: ['deck', deck.id] });
    client.invalidateQueries({ queryKey: ['my-decks'] });
  };
  const submit = useMutation({
    mutationFn: () => submitPublishRequest(apiFetch, deck.id, loiNhan),
    onSuccess: response => {
      setLoiNhan('');
      setMessage(response.trangThai === 'DA_DUYET' ? 'Đã công khai bản sao' : 'Đã gửi yêu cầu công khai');
      refresh();
    },
  });
  const withdraw = useMutation({
    mutationFn: () => withdrawPublishRequest(apiFetch, status.id),
    onSuccess: () => { setMessage('Đã rút yêu cầu'); refresh(); },
  });
  const pending = submit.isPending || withdraw.isPending;
  const error = submit.error || withdraw.error;
  const isPublic = deck.quyenTruyCap === 'CONG_KHAI';
  const allowed = !isPublic && canResubmit(status);
  const direct = !!deck.banSao?.tuCongKhai;
  const waiting = status?.trangThai === 'CHO_DUYET';
  const approver = deck.banSao?.boGocXemDuoc ? 'tác giả bộ gốc' : 'quản trị viên';
  const changes = useQuery({
    queryKey: ['deck-cards', deck.id, 'changes', deck.version],
    queryFn: () => copyChanges(apiFetch, deck.id),
    enabled: !isPublic,
  });
  const summary = summarize(changes.data);
  const unchanged = changes.data && !changes.data.coThayDoi;

  return <section className={`panel ${styles.panel}`} aria-labelledby="publish-title">
    <div className={styles.head}>
      <h2 id="publish-title" className="panel-title">Công khai bản sao</h2>
      {status && <span className={`stamp ${PUBLISH_STAMP[status.trangThai]}`}>{PUBLISH_STATUS[status.trangThai]}</span>}
    </div>
    <p className={styles.lead}>{direct
      ? 'Bạn có quyền duyệt bộ gốc nên công khai được ngay, không cần gửi yêu cầu.'
      : `Bản sao chỉ hiện trong thư viện khi ${approver} duyệt. Bạn vẫn sửa bản sao tự do.`}</p>

    {status && <Steps status={status} />}

    {status && <dl className={styles.meta}>
      <div><dt>Người duyệt</dt><dd>{APPROVER[status.nguoiDuyet]}</dd></div>
      <div><dt>Gửi lúc</dt><dd>{formatTime(status.createdAt)}</dd></div>
      {waiting && <div><dt>Hết hạn</dt><dd>{formatTime(status.hetHanAt)}{daysLeft(status.hetHanAt) && <small>{daysLeft(status.hetHanAt)}</small>}</dd></div>}
      {status.guiLaiSauAt && !canResubmit(status) && <div><dt>Gửi lại sau</dt><dd>{formatTime(status.guiLaiSauAt)}</dd></div>}
    </dl>}
    {status?.lyDo && <blockquote className={styles.reason}><span>Lý do từ người duyệt</span>{status.lyDo}</blockquote>}

    {!isPublic && <div className={`${styles.changes}${unchanged ? ` ${styles.changesNone}` : ''}`}>
      <div className={styles.changesHead}>
        <span className={styles.changesTitle}>So với bộ gốc</span>
        {changes.data && <button type="button" className={styles.linkBtn} onClick={() => setShowChanges(true)}>Xem chi tiết</button>}
      </div>
      {changes.isLoading && <p className={styles.changesText} role="status">Đang so sánh với bộ gốc…</p>}
      {changes.error && <p className={styles.changesText} role="alert">Chưa so sánh được: {changes.error.message}</p>}
      {unchanged && <p className={styles.changesText}><Icon name="alert" />Chưa có gì khác bộ gốc. Sửa tên, mô tả hoặc thêm, sửa thẻ rồi mới xin công khai được.</p>}
      {summary.length > 0 && <ul className={styles.changeList}>{summary.map(part => <li key={part}>{part}</li>)}</ul>}
    </div>}
    {showChanges && changes.data && <Modal isOpen onClose={() => setShowChanges(false)} title="Thay đổi so với bộ gốc" className={styles.changesModal}>
      <CopyChanges diff={changes.data} />
    </Modal>}

    {message && <p className={styles.done} role="status"><Icon name="check" />{message}</p>}
    {error && (reasonOf(error) || error.status === 409
      ? <p className="notice notice-danger" role="alert">{PUBLISH_REASON[reasonOf(error)] || error.message}</p>
      : <ErrorState title="Chưa gửi được yêu cầu" description={error.message} onRetry={() => submit.reset()} />)}

    {waiting && <button type="button" className={`btn btn-secondary btn-sm ${styles.full}`} disabled={pending} aria-busy={withdraw.isPending} onClick={() => withdraw.mutate()}><Icon name="x" />{withdraw.isPending ? 'Đang rút…' : 'Rút yêu cầu'}</button>}
    {allowed && <form className={styles.form} onSubmit={event => { event.preventDefault(); if (!pending && changes.data?.coThayDoi) submit.mutate(); }}>
      {!direct && <div className="field">
        <label className="field-label" htmlFor="publish-note">Lời nhắn cho người duyệt<span className="optional">Không bắt buộc</span></label>
        <textarea className="textarea" id="publish-note" rows={3} maxLength={500} value={loiNhan} onChange={event => setLoiNhan(event.target.value)} placeholder="Ví dụ: mình đã bổ sung câu ví dụ và âm thanh" />
      </div>}
      <button type="submit" className={`btn btn-primary ${styles.full}`} disabled={pending || !changes.data?.coThayDoi} aria-busy={submit.isPending}><Icon name="globe" />{submit.isPending ? 'Đang xử lý…' : direct ? 'Công khai ngay' : 'Xin công khai'}</button>
    </form>}
  </section>;
}
