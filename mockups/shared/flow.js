(function () {
  'use strict';
  const key = 'vocab:dot3:demo:v1';
  const seed = {notifications:[{id:1,title:'Một phiên ngắn cho hôm nay',text:'Bạn còn 8 từ đến hạn. Chọn thời gian phù hợp để ôn.',read:false,href:'../dot2/hom-nay.html'},{id:2,title:'Tổng kết tuần đã sẵn sàng',text:'Xem các kỹ năng tiến bộ và ba từ cần chú ý.',read:false,href:'tong-ket-tuan.html'},{id:3,title:'Báo cáo đã được tiếp nhận',text:'Báo cáo về nghĩa của receipt đang được kiểm tra.',read:true,href:'bao-cao-noi-dung.html'}],recordings:[{id:1,word:'receipt',date:'10/10/2026',accuracy:74,fluency:null},{id:2,word:'receipt',date:'12/10/2026',accuracy:83,fluency:null},{id:3,word:'schedule',date:'12/10/2026',accuracy:79,fluency:76}],reports:[{id:201,target:'Thẻ receipt',kind:'Nghĩa chưa chính xác',state:'Chờ xử lý',detail:'Nghĩa “công thức” không khớp câu Keep the receipt.'},{id:202,target:'Đầu ra viết câu AI',kind:'Giải thích sai',state:'Chờ xử lý',detail:'Phản hồi chưa giải thích rõ thì hiện tại hoàn thành.'},{id:203,target:'Bộ TOEIC công sở',kind:'Nội dung không phù hợp',state:'Đã xử lý',detail:'Báo cáo đã được xác minh và giữ nội dung.'}],deletion:null,committed:0,announcements:[],quotas:{AI:20,TTS:60,SPEECH:10},badges:[{id:1,name:'Bước đầu bền bỉ',rule:'Hoàn thành 3 phiên hợp lệ',active:true},{id:2,name:'Một tuần đều đặn',rule:'Học 7 ngày có ít nhất 5 lượt hợp lệ/ngày',active:true}],challenges:[{id:1,name:'Tuần học nhẹ nhàng',rule:'40 lượt ôn hợp lệ trong 7 ngày',active:true}]};

  function read() {
    let saved;
    try { saved = JSON.parse(sessionStorage.getItem(key)); } catch {}
    return Object.assign(structuredClone(seed), {requests:[],draft:null,usage:6}, saved || {});
  }
  function write(data) {
    try { sessionStorage.setItem(key, JSON.stringify(data)); } catch { VL.toast('Không lưu được dữ liệu mẫu trong tab này.', 'error'); }
    window.dispatchEvent(new Event('vocab:flow-update'));
  }
  window.VLFlow = {read, write, reset:()=>write(Object.assign(structuredClone(seed),{requests:[],draft:null,usage:6}))};
  function mount() {
    if (!VL.ready || !VL.me()) return;
    const e=VL.esc, url=VL.url;
    const header=document.querySelector('.header-actions');
    if(document.body.dataset.nav?.startsWith('quan-tri-')||document.body.dataset.nav?.startsWith('admin-'))document.querySelector('.sidebar-links')?.insertAdjacentHTML('afterbegin',`<a class="nav-link" href="${url('dot2/hom-nay.html')}">${VL.icon('arrow-left')}<span class="nav-label">Trở về học tập</span></a>`);
    if(header&&!header.querySelector('[data-flow-bell]'))header.insertAdjacentHTML('afterbegin', `<a class="btn btn-quiet btn-icon" data-flow-bell href="${url('dot3/thong-bao.html')}" aria-label="Thông báo">${VL.icon('bell')}<span class="sr-only" data-unread-badge></span></a>`);
    if(header){header.insertAdjacentHTML('afterbegin',`<button class="btn btn-quiet btn-icon flow-menu-button" type="button" aria-label="Mở điều hướng">${VL.icon('menu')}</button>`);header.querySelector('.flow-menu-button').onclick=()=>{const previous=document.activeElement,d=document.createElement('dialog');d.className='flow-dialog flow-menu';d.setAttribute('aria-label','Điều hướng ứng dụng');d.innerHTML='<div class="row-between"><h2>Điều hướng</h2><button type="button" class="btn btn-quiet btn-icon" aria-label="Đóng điều hướng">'+VL.icon('x')+'</button></div><nav>'+document.querySelector('.sidebar-links').innerHTML+'</nav>';document.body.appendChild(d);d.querySelector('button').onclick=()=>d.close();d.addEventListener('close',()=>{d.remove();previous.focus();},{once:true});d.showModal();};}
    function unread() { const count=read().notifications.filter(x=>(!x.userId||x.userId===VL.me().id)&&!x.read).length;document.querySelectorAll('[data-flow-bell]').forEach(x=>{x.setAttribute('aria-label','Thông báo, '+count+' chưa đọc');x.querySelector('[data-unread-badge]').textContent=count;}); }
    unread();window.addEventListener('vocab:flow-update',unread);
    const name=location.pathname.split('/').pop();
    const entries={
      'hom-nay.html':[['Gợi ý cho hôm nay','goi-y'],['Tổng kết tuần','tong-ket-tuan'],['Thành tích','thanh-tich']],
      'bo-the.html':[['Tạo thẻ từ đoạn văn','ai-xuong-the'],['Lịch sử AI','ai-lich-su']],
      'bo-the-chi-tiet.html':[['Tạo thẻ từ đoạn văn','ai-xuong-the'],['Bản đồ làm chủ','ban-do-lam-chu']],
      'so-tay.html':[['Gợi ý ôn tập','goi-y'],['Viết câu vận dụng','ai-viet-cau'],['Luyện phát âm','phat-am']],
      'thong-ke.html':[['Bản đồ làm chủ','ban-do-lam-chu'],['Tổng kết tuần','tong-ket-tuan'],['Thành tích','thanh-tich']],
      'ca-nhan.html':[['Thông báo của tôi','thong-bao'],['Dữ liệu cá nhân','ca-nhan-du-lieu']],
      'hoc-tong-ket.html':[['Viết câu vận dụng','ai-viet-cau'],['Luyện phát âm','phat-am'],['Thành tích','thanh-tich']],
      'luyen-tap-ket-qua.html':[['Gợi ý ôn tập','goi-y'],['Viết câu vận dụng','ai-viet-cau']],
      'thu-vien-chi-tiet.html':[['Báo cáo nội dung','bao-cao-noi-dung']]
    };
    const list=entries[name];
    if(list){const host=document.querySelector('.app-main .page');if(host){const box=document.createElement('section');box.className='sheet flow-related';box.setAttribute('aria-label','Hoạt động liên quan');box.innerHTML=`<p class="caption">Tiếp tục học · dữ liệu mô phỏng</p><div class="row">${list.map(([label,file])=>{const q=new URLSearchParams();if(name==='bo-the-chi-tiet.html'&&new URLSearchParams(location.search).get('id'))q.set('deck',new URLSearchParams(location.search).get('id'));return `<a class="btn btn-secondary" href="${url('dot3/'+file+'.html')}${q.size?'?'+q:''}">${e(label)}</a>`;}).join('')}</div>`;host.appendChild(box);}}
    if(name==='bo-the-chi-tiet.html'){
      const host=document.getElementById('active-cards');
      if(host){const attach=()=>host.querySelectorAll('.card-row').forEach(row=>{const tools=row.querySelector('.card-tools'),word=row.querySelector('.entry-word')?.textContent;if(!tools||tools.querySelector('[data-flow-context]'))return;tools.insertAdjacentHTML('beforeend',`<details class="flow-card-more"><summary class="btn btn-quiet btn-sm">Thêm thao tác</summary><div class="flow-card-links"><button class="btn btn-secondary btn-sm" type="button" data-flow-context>Giải thích ngữ cảnh</button><a class="btn btn-media btn-sm" href="${url('dot3/phat-am.html')}?word=${encodeURIComponent(word)}">Luyện phát âm</a><a class="btn btn-quiet btn-sm" href="${url('dot3/bao-cao-noi-dung.html')}?target=${encodeURIComponent('Thẻ '+word)}">Báo cáo</a></div></details>`);});attach();new MutationObserver(attach).observe(host,{childList:true,subtree:true});
        host.addEventListener('click',event=>{if(!event.target.closest('[data-flow-context]'))return;const row=event.target.closest('.card-row'),word=row.querySelector('.entry-word').textContent,sentence=row.querySelector('.entry-example')?.textContent||word,previous=document.activeElement,d=document.createElement('dialog');d.className='flow-dialog';d.setAttribute('aria-labelledby','flow-dialog-title');d.innerHTML=`<h2 id="flow-dialog-title">Ngữ cảnh của ${e(word)}</h2><p class="en">${e(sentence)}</p><p>${e(row.querySelector('.entry-mean').textContent)}</p><p class="small muted">Đang xem nghĩa và ví dụ đã lưu trên thẻ. AI đợt 3 chưa được kết nối.</p><div class="row"><a class="btn btn-primary" href="${url('dot3/ai-viet-cau.html')}?word=${encodeURIComponent(word)}">Tập viết câu</a><button type="button" class="btn btn-secondary">Đóng, tiếp tục xem thẻ</button></div>`;document.body.appendChild(d);d.querySelector('button').onclick=()=>d.close();d.addEventListener('close',()=>{d.remove();previous.focus();},{once:true});d.showModal();});}
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
