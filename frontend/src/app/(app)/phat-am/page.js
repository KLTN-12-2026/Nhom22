'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { fetchAllPages } from '@/lib/fetch-all-pages';
import { pcmWav } from '@/lib/remote-contract.mjs';
import { RemoteState, EmptyData } from '@/components/remote/Remote';
import { PronunciationResult } from '@/components/remote/PronunciationResult';
import { SpeakButton } from '@/components/content/SpeakButton';
import { QuotaMeter } from '@/components/billing/PlanAccess';
import styles from './page.module.css';
export default function PronunciationPage() {
  const [deck,setDeck]=useState(''); const [card,setCard]=useState('');
  const [state,setState]=useState('idle'); const [message,setMessage]=useState(''); const [file,setFile]=useState(null); const [preview,setPreview]=useState(''); const [result,setResult]=useState(null);
  const stream=useRef(null), recorder=useRef(null), timer=useRef(null), audioUrl=useRef(''), alive=useRef(true);
  const client=useQueryClient();
  const decks=useQuery({queryKey:['all-my-decks'],queryFn:()=>fetchAllPages('/api/v1/decks')});
  const cards=useQuery({queryKey:['pronunciation-cards',deck],enabled:!!deck,queryFn:()=>fetchAllPages(`/api/v1/decks/${encodeURIComponent(deck)}/cards`)});
  const selected=cards.data?.find(c=>c.id===card);
  const busy=['recording','converting','sending','opening'].includes(state);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;clearTimeout(timer.current);if(recorder.current?.state==='recording')recorder.current.stop();stream.current?.getTracks().forEach(t=>t.stop());if(audioUrl.current)URL.revokeObjectURL(audioUrl.current);};},[]);
  function reset() { if(audioUrl.current)URL.revokeObjectURL(audioUrl.current);audioUrl.current='';setFile(null);setPreview('');setResult(null);setMessage('');setState('idle'); }
  async function convert(blob) {
    setState('converting');
    let context;
    try {
      context=new AudioContext();
      const decoded=await context.decodeAudioData(await blob.arrayBuffer());
      if(decoded.duration<0.3 || decoded.duration>15.2)throw new Error('Bản ghi phải dài từ 0,3 đến 15 giây.');
      const length=Math.min(decoded.length,Math.floor(decoded.sampleRate*15));
      const mono=new Float32Array(length);
      for(let c=0;c<decoded.numberOfChannels;c++){const channel=decoded.getChannelData(c);for(let i=0;i<length;i++)mono[i]+=channel[i]/decoded.numberOfChannels;}
      const wav=new File([pcmWav(mono,decoded.sampleRate)],'phat-am.wav',{type:'audio/wav'});
      if(!alive.current)return;
      if(audioUrl.current)URL.revokeObjectURL(audioUrl.current);
      audioUrl.current=URL.createObjectURL(wav);setPreview(audioUrl.current);setFile(wav);setState('ready');setMessage('Đã chuẩn bị bản ghi. Nghe lại trước khi gửi.');
    } catch(e){if(alive.current){setMessage(e.message || 'Không đọc được bản ghi. Hãy thử tải tệp WAV.');setState('idle');}}
    finally{await context?.close();}
  }
  async function record() {
    if(busy || !card)return;
    if(!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder){setMessage('Trình duyệt chưa hỗ trợ micro. Bạn có thể chọn tệp WAV.');return;}
    reset();setState('opening');
    try {
      stream.current=await navigator.mediaDevices.getUserMedia({audio:true});
      if(!alive.current){stream.current.getTracks().forEach(t=>t.stop());return;}
      const rec=new MediaRecorder(stream.current);recorder.current=rec;const chunks=[];
      rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
      rec.onstop=()=>{clearTimeout(timer.current);stream.current?.getTracks().forEach(t=>t.stop());if(alive.current)convert(new Blob(chunks,{type:rec.mimeType}));};
      rec.start();setState('recording');timer.current=setTimeout(()=>{if(rec.state==='recording')rec.stop();},14900);
    }catch(e){stream.current?.getTracks().forEach(t=>t.stop());setState('idle');setMessage(`Không mở được micro: ${e.message}`);}
  }
  async function assess() {
    if(!file || !card || busy)return;
    setState('sending');setMessage('');
    try {const body=new FormData();body.append('theId',card);body.append('file',file);const data=await apiFetch('/api/v1/pronunciation/assessments',{method:'POST',body});setResult(data);await client.invalidateQueries({queryKey:['pronunciation-history']});await client.invalidateQueries({queryKey:['service-quota']});}
    catch(e){setMessage(e.message);}finally{setState('ready');}
  }
  return <div className={`page ${styles.page}`}><article className="sheet"><div className="form-head"><h1>Góc phát âm</h1><p>Chọn thẻ, nghe mẫu rồi ghi âm tối đa 15 giây.</p></div><QuotaMeter feature="PHAT_AM" /><p className={styles.historyLink}><Link href="/phat-am-lich-su">Lịch sử phát âm</Link></p><RemoteState queries={[decks]}>{!decks.data?.length && <EmptyData>Hãy tạo bộ thẻ trước khi luyện phát âm.</EmptyData>}<label className="field">Bộ thẻ<select className="select" value={deck} disabled={busy} onChange={e=>{reset();setDeck(e.target.value);setCard('');}}><option value="">Chọn bộ thẻ</option>{decks.data?.map(d=><option key={d.id} value={d.id}>{d.ten}</option>)}</select></label></RemoteState>{deck && <RemoteState queries={[cards]}><label className="field">Từ muốn luyện<select className="select" value={card} disabled={busy} onChange={e=>{reset();setCard(e.target.value);}}><option value="">Chọn thẻ</option>{cards.data?.map(c=><option key={c.id} value={c.id}>{c.tu} — {c.nghiaVi}</option>)}</select></label></RemoteState>}
    {selected && <div className={styles.workspace}><section className={styles.recordPanel}><h2 className="word">{selected.tu}</h2><p className="ipa">{selected.phienAm}</p><SpeakButton key={selected.id} text={busy ? '' : selected.tu} /><p className="small muted">Giọng đọc của trình duyệt · <Link href="/ca-nhan/hoc-tap">Chọn giọng và tốc độ</Link></p><div className={styles.actions}><button type="button" className="btn btn-primary" disabled={busy} onClick={record}>Ghi âm</button><button type="button" className="btn btn-danger" disabled={state!=='recording'} onClick={()=>recorder.current?.stop()}>Dừng ghi</button><button type="button" className="btn btn-secondary" disabled={busy} onClick={reset}>Ghi lại</button></div><label className="field">Hoặc chọn tệp WAV<input type="file" accept="audio/wav,.wav" disabled={busy} onChange={e=>{const selectedFile=e.target.files?.[0];if(selectedFile){if(selectedFile.size>524288){setMessage('Tệp tối đa 512 KB.');return;}setResult(null);convert(selectedFile);}e.target.value='';}} /></label>{preview && <audio src={preview} controls aria-label="Nghe lại bản ghi" />}<button type="button" className="btn btn-primary" disabled={!file || busy} onClick={assess}>{state==='sending'?'Đang đánh giá…':'Gửi đánh giá'}</button><p role="status">{state==='recording'?'Đang thu âm…':state==='converting'?'Đang chuẩn bị âm thanh…':message}</p></section><section className={styles.output}><PronunciationResult data={result} /></section></div>}
  </article></div>;
}
