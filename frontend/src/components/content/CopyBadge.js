import Link from 'next/link';
import { Icon } from '@/components/ui';

export function CopyBadge({ banSao, compact = false }) {
  if (!banSao) return null;
  const origin = banSao.boGocXemDuoc
    ? <span className="small">Gốc: <Link href={`/thu-vien/${banSao.boGocId}`}>{banSao.boGocTen}</Link>{!compact && banSao.tacGiaGoc && <span className="muted"> · {banSao.tacGiaGoc}</span>}</span>
    : <span className="small muted">Bộ gốc không còn công khai</span>;
  return <>
    <span className="stamp stamp-accent"><Icon name="copy" />Bản sao</span>
    {origin}
  </>;
}
