'use client';
import { useEffect } from 'react';
import { Icon } from '@/components/ui';
import { GuardedAction } from '@/components/billing/PlanAccess';
import { useAiRequest } from '@/hooks/useAiRequest';
import { usePlanAccess } from '@/hooks/usePlanAccess';

const box = { marginTop: 'var(--space-3)', padding: 'var(--space-3)', border: '1px dashed var(--color-primary-tint)', borderRadius: 'var(--radius-lg)', background: 'var(--color-bg)', fontSize: 'var(--font-size-sm)' };

export function AiMistakeExplain({ sessionId, questionId, existing }) {
  const ai = useAiRequest();
  const quota = usePlanAccess().of('AI');
  const { resume } = ai;
  const existingId = existing?.requestId;
  useEffect(() => {
    if (existingId) resume(existingId);
  }, [existingId, resume]);

  const ketQua = ai.data?.trangThai === 'HOAN_TAT' ? ai.data.ketQua : null;
  if (ketQua) {
    return <div style={box} aria-live="polite">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: 'var(--space-2)' }}>
        <Icon name="sparkles" />AI giải thích
      </div>
      <p>{ketQua.giaiThich}</p>
      {ketQua.meoNho && <p style={{ marginTop: 'var(--space-2)' }}><strong>Mẹo nhớ:</strong> {ketQua.meoNho}</p>}
      {ketQua.viDu && <p style={{ marginTop: 'var(--space-2)', color: 'var(--color-ink-2)' }} lang="en">{ketQua.viDu}</p>}
    </div>;
  }

  const start = () => ai.start(`/api/v1/practice/sessions/${encodeURIComponent(sessionId)}/questions/${encodeURIComponent(questionId)}/ai-explanation`);
  const remaining = quota && quota.remaining != null ? `còn ${quota.remaining}/${quota.limit} lượt AI hôm nay` : null;
  return <div style={{ marginTop: 'var(--space-3)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-2)' }}>
    <GuardedAction feature="AI" className="btn btn-quiet btn-sm" onClick={start} disabled={ai.busy}>
      <Icon name="sparkles" />{ai.busy ? 'AI đang giải thích...' : 'AI giải thích vì sao sai'}
    </GuardedAction>
    {remaining && !ai.busy && <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-ink-2)' }}>{remaining}</span>}
    {ai.error && <span role="alert" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-danger)' }}>{ai.error}</span>}
  </div>;
}
