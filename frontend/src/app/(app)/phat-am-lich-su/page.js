'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { dateTime } from '@/lib/remote-contract.mjs';
import { RemoteState, EmptyData } from '@/components/remote/Remote';
import { PronunciationResult } from '@/components/remote/PronunciationResult';
import { Pagination, Modal, useToast } from '@/components/ui';
import styles from './page.module.css';
export default function PronunciationHistoryPage() {
  const [page,setPage]=useState(1),[card,setCard]=useState(''),[ids,setIds]=useState([]),[compareIds,setCompareIds]=useState([]),[confirm,setConfirm]=useState(null),[deleting,setDeleting]=useState(false);
  const {toast}=useToast();const client=useQueryClient();
  const query=useQuery({queryKey:['pronunciation-history',page,card],queryFn:()=>apiFetch(`/api/v1/pronunciation/history?page=${page-1}&size=20${card ? `&theId=${encodeURIComponent(card)}` : ''}`)});
  const details=useQuery({queryKey:['pronunciation-comparison',compareIds],enabled:compareIds.length===2,queryFn:()=>Promise.all(compareIds.map(id=>apiFetch(`/api/v1/pronunciation/assessments/${encodeURIComponent(id)}`)))});
  const rows=query.data?.items||[];
  const sameWord=ids.length===2 && rows.filter(r=>ids.includes(r.id)).length===2 && new Set(rows.filter(r=>ids.includes(r.id)).map(r=>r.theId)).size===1;
  async function remove() {
    setDeleting(true);
    try{await apiFetch(`/api/v1/pronunciation/recordings/${encodeURIComponent(confirm.tepGhiAmId)}`,{method:'DELETE'});setConfirm(null);setCompareIds([]);await client.invalidateQueries({queryKey:['pronunciation-history']});toast('Đã xóa bản ghi âm.',{variant:'success'});}catch(e){toast(e.message,{variant:'error'});}finally{setDeleting(false);}
  }
  return <div className={`page ${styles.page}`}><article className="sheet"><div className="form-head"><h1>Lịch sử phát âm</h1><p>Chọn hai lượt của cùng một thẻ để xem chỉ số.</p></div><Link href="/phat-am" className="btn btn-primary">Ghi lượt mới</Link><label className="field">Lọc theo ID thẻ (không bắt buộc)<input className="input" inputMode="numeric" value={card} onChange={e=>{if(/^\d*$/.test(e.target.value)){setCard(e.target.value);setPage(1);setIds([]);setCompareIds([]);}}} /></label><RemoteState queries={[query]}>{!rows.length && <EmptyData>Chưa có lượt phát âm.</EmptyData>}<div className={styles.list}>{rows.map(r=><article className={styles.record} key={r.id}><label><input type="checkbox" checked={ids.includes(r.id)} onChange={()=>{setCompareIds([]);setIds(old=>old.includes(r.id)?old.filter(id=>id!==r.id):[...old.slice(-1),r.id]);}} /> Chọn lượt</label><div className={styles.recordMain}><h2>{r.vanBanMau}</h2><p>{dateTime(r.createdAt)} · {r.tongDiem == null ? 'Chưa có điểm' : `${r.tongDiem}/100`}{r.moPhong?' · Mô phỏng':''}</p></div>{r.tepGhiAmId && <button type="button" className="btn btn-danger" onClick={()=>setConfirm(r)}>Xóa bản ghi âm</button>}</article>)}</div><button type="button" className="btn btn-secondary" disabled={!sameWord} onClick={()=>setCompareIds([...ids])}>So sánh hai lượt cùng thẻ</button><Pagination page={page} totalPages={query.data?.totalPages||0} onPageChange={p=>{setPage(p);setIds([]);setCompareIds([]);}} /></RemoteState>{compareIds.length===2 && <RemoteState queries={[details]}>{details.data && <>{(details.data[0].nhaCungCap!==details.data[1].nhaCungCap || details.data[0].moPhong!==details.data[1].moPhong) && <p className="notice">Hai lượt khác nguồn đánh giá, không nên so sánh trực tiếp điểm.</p>}<div className={styles.compareGrid}>{[...details.data].sort((a,b)=>Date.parse(a.createdAt)-Date.parse(b.createdAt)).map(d=><PronunciationResult key={d.id} data={d} />)}</div></>}</RemoteState>}</article><Modal isOpen={!!confirm} onClose={()=>{if(!deleting)setConfirm(null);}} loading={deleting} title="Xóa bản ghi âm"><p>Bạn muốn xóa âm thanh của lượt {confirm?.vanBanMau}? Chỉ số đánh giá vẫn được giữ.</p><button type="button" className="btn btn-danger" disabled={deleting} onClick={remove}>{deleting?'Đang xóa…':'Xóa bản ghi'}</button></Modal></div>;
}
