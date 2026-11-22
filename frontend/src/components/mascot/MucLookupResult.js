'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { bestSense, dictionaryHref, ipa, lookupKey, lookupPath, pickEntry, posLabel, senses } from '@/lib/dictionary.mjs';
import { SpeakButton } from '@/components/content/SpeakButton';
import { Icon } from '@/components/ui';

export function MucLookupResult({ term, hint, onSave, limit = 3 }) {
  const lookup = useQuery({ queryKey: lookupKey(term), queryFn: () => apiFetch(lookupPath(term)), staleTime: 300000 });
  if (lookup.isPending) return <p className="muc-look-status" role="status">Đang tra “{term}”…</p>;
  if (lookup.isError) return <p className="muc-look-status" role="alert">Chưa tra được, thử lại sau nhé.</p>;
  const entry = pickEntry(lookup.data, term);
  if (!entry) {
    const near = lookup.data?.goiY || [];
    return <div className="muc-look-status">
      <p>Từ điển chưa có “{term}”.</p>
      {near.length > 0 && <p>Gần giống: {near.slice(0, 4).map((item, i) => <span key={item.id}>{i > 0 && ', '}<Link href={dictionaryHref(item.tu)} lang="en">{item.tu}</Link></span>)}</p>}
    </div>;
  }
  const best = bestSense(entry, hint);
  const seen = new Set();
  const list = [best, ...senses(entry).filter(sense => sense.key !== best?.key)].filter(sense => {
    const text = sense && `${sense.tuLoai || ''}|${sense.noiDung.trim().toLowerCase()}`;
    if (!sense || seen.has(text)) return false;
    seen.add(text);
    return true;
  });
  const shown = list.slice(0, limit);
  return <div className="muc-look">
    <div className="muc-look-head">
      <strong lang="en">{entry.tu}</strong>
      {entry.phienAm && <span className="entry-ipa">{ipa(entry.phienAm)}</span>}
      <SpeakButton text={entry.tu} compact />
    </div>
    <ol className="muc-look-senses">
      {shown.map(sense => <li key={sense.key}>
        {onSave && <button type="button" className="btn btn-secondary btn-sm btn-icon" title="Lưu nghĩa này thành thẻ" aria-label={`Lưu “${entry.tu}: ${sense.noiDung}” thành thẻ`} onClick={() => onSave(entry, sense)}><Icon name="plus" /></button>}
        <span className="muc-look-sense">
          {sense.tuLoai && <span className="pos">{posLabel(sense.tuLoai)}</span>} {sense.noiDung}
          {sense.viDu?.[0] && <span className="muc-look-example" lang="en">{sense.viDu[0].cau}</span>}
        </span>
      </li>)}
    </ol>
    <div className="muc-look-foot">
      {list.length > shown.length && <span className="small muted">+{list.length - shown.length} nghĩa khác</span>}
      <Link href={dictionaryHref(entry.tu)}>Mở trong Từ điển</Link>
    </div>
  </div>;
}
