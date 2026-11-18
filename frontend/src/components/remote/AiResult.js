'use client';
import { AI_STATUS, AI_TYPE, dateTime } from '@/lib/remote-contract.mjs';
export function AiResult({ data }) {
  if (!data) return null;
  const result = data.ketQua;
  return <section><h2>{AI_TYPE[data.loai] || 'Kết quả yêu cầu'}</h2><p>{AI_STATUS[data.trangThai]} · {dateTime(data.createdAt)}{data.moPhong ? ' · Nhà cung cấp mô phỏng' : ''}</p>{data.anKiemDuyet && <p className="notice">Nội dung đã được ẩn bởi kiểm duyệt.</p>}{data.maLoi && <p role="alert">{data.maLoi}</p>}{data.banNhap?.map(c=><article key={c.id}><h3>{c.tu}</h3><p>{c.nghiaVi}</p><p lang="en">{c.viDuEn}</p></article>)}{result && <div>{['cauSua','nhanXet','cachDungTu','nghiaVi','giaiThich','viDuEn','dichVi','meoNho'].map(k=>result[k] && <p key={k}>{result[k]}</p>)}{result.loi?.map((e,i)=><p key={i}>{e.doanGoc} → {e.doanSua}: {e.giaiThich}</p>)}</div>}</section>;
}
