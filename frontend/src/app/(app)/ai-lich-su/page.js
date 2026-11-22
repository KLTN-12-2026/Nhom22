'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { AI_STATUS, AI_TYPE, aiPending, dateTime } from '@/lib/remote-contract.mjs';
import { RemoteState, EmptyData } from '@/components/remote/Remote';
import { AiResult } from '@/components/remote/AiResult';
import { Pagination, Modal } from '@/components/ui';
import styles from './page.module.css';
export default function AiHistoryPage() {
  const [type,setType]=useState(''); const [page,setPage]=useState(1); const [id,setId]=useState(null);
  const history=useQuery({queryKey:['ai-history',type,page],queryFn:()=>apiFetch(`/api/v1/ai/history?page=${page-1}&size=20${type ? `&loai=${type}` : ''}`),refetchInterval:120000});
  const quota=useQuery({queryKey:['service-quota'],queryFn:()=>apiFetch('/api/v1/me/service-quota'),refetchInterval:120000});
  const detail=useQuery({queryKey:['ai-request',id],enabled:!!id,queryFn:()=>apiFetch(`/api/v1/ai/requests/${encodeURIComponent(id)}`),refetchInterval:q=>aiPending(q.state.data?.trangThai)?5000:false});
  return <div className={`page ${styles.page}`}><article className="sheet"><div className="form-head"><h1>Lịch sử AI và hạn mức</h1><p>Theo dõi yêu cầu và kết quả của bạn.</p></div><RemoteState queries={[quota]}><div className="d3-metrics">{quota.data?.hanMuc.map(h=><div className="d3-metric" key={h.loai}><strong>{h.conLai}/{h.gioiHan}</strong><span>{h.loai} · đã dùng {h.soDung}, đang giữ {h.soGiu}</span></div>)}</div><p>Đặt lại lúc {dateTime(quota.data?.datLaiAt)}</p></RemoteState><div className={styles.sectionHeader}><label className="field">Loại yêu cầu<select className="select" value={type} onChange={e=>{setType(e.target.value);setPage(1);}}><option value="">Tất cả</option>{Object.entries(AI_TYPE).map(([k,l])=><option key={k} value={k}>{l}</option>)}</select></label><Link className="btn btn-primary" href="/ai-xuong-the">Tạo thẻ mới</Link></div><RemoteState queries={[history]}>{!history.data?.items.length && <EmptyData>Chưa có yêu cầu AI.</EmptyData>}<div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Yêu cầu</th><th>Trạng thái</th><th>Thời gian</th><th>Thao tác</th></tr></thead><tbody>{history.data?.items.map(r=><tr key={r.id}><td>{AI_TYPE[r.loai]}{r.moPhong && <small> · Mô phỏng</small>}</td><td>{AI_STATUS[r.trangThai]}{r.maLoi && ` · ${r.maLoi}`}</td><td>{dateTime(r.createdAt)}</td><td><button type="button" className="btn btn-secondary" onClick={()=>setId(r.id)}>Chi tiết</button>{r.loai==='TAO_THE' && <Link className="btn btn-quiet" href={`/ai-xuong-the?requestId=${encodeURIComponent(r.id)}`}>Mở bản nháp</Link>}</td></tr>)}</tbody></table></div><Pagination page={page} totalPages={history.data?.totalPages||0} onPageChange={setPage} /></RemoteState></article><Modal isOpen={!!id} onClose={()=>setId(null)} title="Chi tiết yêu cầu AI"><RemoteState queries={[detail]}><AiResult data={detail.data} /></RemoteState></Modal></div>;
}
