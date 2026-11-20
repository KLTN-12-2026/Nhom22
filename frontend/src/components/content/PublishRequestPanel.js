'use client';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { ErrorState, Icon } from '@/components/ui';
import {
  APPROVER, PUBLISH_REASON, PUBLISH_STAMP, PUBLISH_STATUS, canResubmit, formatTime, reasonOf,
  submitPublishRequest, withdrawPublishRequest,
} from '@/lib/publish-requests.mjs';

export function PublishRequestPanel({ deck }) {
  const client = useQueryClient();
  const [loiNhan, setLoiNhan] = useState('');
  const [message, setMessage] = useState('');
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

  return <section className="panel" aria-labelledby="publish-title">
    <h2 id="publish-title" className="panel-title">Công khai bản sao</h2>
    <p className="small muted">Bản sao chỉ hiện trong thư viện khi {deck.banSao?.boGocXemDuoc ? 'tác giả bộ gốc' : 'quản trị viên'} duyệt. Bạn vẫn sửa bản sao tự do.</p>
    {status && <dl className="kv">
      <dt>Trạng thái</dt><dd><span className={`stamp ${PUBLISH_STAMP[status.trangThai]}`}>{PUBLISH_STATUS[status.trangThai]}</span></dd>
      <dt>Người duyệt</dt><dd>{APPROVER[status.nguoiDuyet]}</dd>
      <dt>Gửi lúc</dt><dd>{formatTime(status.createdAt)}</dd>
      {status.trangThai === 'CHO_DUYET' && <><dt>Hết hạn</dt><dd>{formatTime(status.hetHanAt)}</dd></>}
      {status.lyDo && <><dt>Lý do</dt><dd>{status.lyDo}</dd></>}
      {status.guiLaiSauAt && !canResubmit(status) && <><dt>Gửi lại sau</dt><dd>{formatTime(status.guiLaiSauAt)}</dd></>}
    </dl>}
    {message && <p className="notice notice-success" role="status"><Icon name="check" />{message}</p>}
    {error && (reasonOf(error) || error.status === 409
      ? <p className="notice notice-danger" role="alert">{PUBLISH_REASON[reasonOf(error)] || error.message}</p>
      : <ErrorState title="Chưa gửi được yêu cầu" description={error.message} onRetry={() => submit.reset()} />)}
    {status?.trangThai === 'CHO_DUYET' && <button type="button" className="btn btn-secondary" disabled={pending} aria-busy={withdraw.isPending} onClick={() => withdraw.mutate()}>{withdraw.isPending ? 'Đang rút…' : 'Rút yêu cầu'}</button>}
    {allowed && <form className="stack-sm" onSubmit={event => { event.preventDefault(); if (!pending) submit.mutate(); }}>
      <div className="field">
        <label className="field-label" htmlFor="publish-note">Lời nhắn cho người duyệt (không bắt buộc)</label>
        <textarea className="textarea" id="publish-note" rows={3} maxLength={500} value={loiNhan} onChange={event => setLoiNhan(event.target.value)} placeholder="Ví dụ: mình đã bổ sung câu ví dụ và âm thanh" />
      </div>
      <button type="submit" className="btn btn-primary" disabled={pending} aria-busy={submit.isPending}><Icon name="globe" />{submit.isPending ? 'Đang gửi…' : 'Xin công khai'}</button>
    </form>}
  </section>;
}
