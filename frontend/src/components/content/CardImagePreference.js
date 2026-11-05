'use client';
import { Icon } from '@/components/ui';

export function CardImagePreference({ checked, onChange }) {
  return <label className="card-image-preference" title="Ghi nhớ trên thiết bị này"><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} /><Icon name="image" /><span>Hiển thị ảnh</span></label>;
}
