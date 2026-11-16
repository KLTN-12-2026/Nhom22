(async function () {
  'use strict';
  if (!await VL.ready) return;
  if (document.body.dataset.role === 'ADMIN' && !VL.me()?.vaiTro.includes('ADMIN')) return;
  const e = VL.esc, icon = VL.icon, page = document.body.dataset.screen;
  const root = document.getElementById('d3-content'), status = document.getElementById('d3-status');
  const stateSelect = document.getElementById('d3-state');
  const mode = () => stateSelect.value;
  let data=VLFlow.read();
  function save() { VLFlow.write(data); }
  const b = (label, action, variant='secondary', extra='') => `<button type="button" class="btn btn-${variant}" data-action="${action}" ${extra}>${label}</button>`;
  const link = (label, href, variant='secondary') => `<a class="btn btn-${variant}" href="${href}">${label}</a>`;
  const notice = (text,kind='') => `<div class="notice ${kind?'notice-'+kind:''}"><span>${text}</span></div>`;
  const field = (label,name,value='',type='text',extra='') => `<div class="field"><label class="field-label" for="${name}">${label}</label><input class="input" id="${name}" name="${name}" type="${type}" value="${e(value)}" ${extra}></div>`;
  const textarea = (label,name,value='',extra='') => `<div class="field"><label class="field-label" for="${name}">${label}</label><textarea class="textarea" id="${name}" name="${name}" rows="5" ${extra}>${e(value)}</textarea></div>`;
  const select = (label,name,options) => `<div class="field"><label class="field-label" for="${name}">${label}</label><select class="select" id="${name}" name="${name}">${options.map(([v,t])=>`<option value="${e(v)}">${e(t)}</option>`).join('')}</select></div>`;
  const output = text => `<section class="d3-output d3-stack" id="output" tabindex="-1" aria-label="Kết quả"><div class="empty"><h2>${text}</h2><p>Kết quả chỉ xuất hiện sau khi bạn yêu cầu xử lý.</p></div></section>`;
  const stamp = (text,kind='quiet') => `<span class="stamp stamp-${kind}">${e(text)}</span>`;
  const metrics = rows => `<div class="d3-metrics">${rows.map(([n,t])=>`<div class="d3-metric"><strong>${e(n)}</strong><span>${e(t)}</span></div>`).join('')}</div>`;
  const table = (heads,rows,caption) => `<div class="d3-table-wrap"><table class="d3-table"><caption>${e(caption)}</caption><thead><tr>${heads.map(x=>`<th scope="col">${e(x)}</th>`).join('')}</tr></thead><tbody>${rows.map(cells=>`<tr>${cells.map((x,i)=>`<td data-label="${e(heads[i]||'')}">${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const source = 'Please keep the receipt. You can request a refund within seven days. The store will confirm your appointment by email.';
  const samples = [{word:'receipt',meaning:'biên lai; giấy biên nhận',sentence:'Please keep the receipt.',duplicate:false},{word:'refund',meaning:'khoản hoàn tiền; hoàn tiền',sentence:'You can request a refund within seven days.',duplicate:false},{word:'appointment',meaning:'cuộc hẹn',sentence:'The store will confirm your appointment by email.',duplicate:true}];
  function focusOutput() { document.getElementById('output')?.focus(); }
  function message(text) { status.textContent=text;if(text.startsWith('Đã'))window.VocabMascot?.react('success'); }
  const AI_STATE={CHO:'Chờ',DANG_XU_LY:'Đang xử lý',HOAN_TAT:'Xong',LOI:'Lỗi',KHONG_XAC_DINH:'Chưa xác định'};
  const AI_ERROR={SAI_SCHEMA:'AI trả dữ liệu sai cấu trúc nên không có thẻ nào được tạo.',KHONG_CO_TU:'Không tìm thấy từ tiếng Anh phù hợp trong đoạn văn.',MO_PHONG_LOI:'Dịch vụ AI mô phỏng báo lỗi.',MO_PHONG_TAM_THOI:'Dịch vụ AI tạm thời không phản hồi sau 3 lần thử lại.',NCC_TU_CHOI:'Nhà cung cấp AI từ chối yêu cầu.',TEP_QUA_DAI:'Tệp có hơn 5.000 ký tự.',TEP_KHONG_HOP_LE:'Không đọc được tệp Word.'};
  let aiPoll=null,aiCommitKey=null,aiCurrent=null,aiLast=null;
  const aiDecks=()=>VLDemo.db.decks.filter(x=>x.ownerId===VL.me().id&&!x.deleted).map(x=>[x.id,x.name]);
  function aiTrack(r){const list=data.requests;let item=list.find(x=>x.aiId===r.id);if(!item){item={id:Date.now(),aiId:r.id,userId:VL.me().id,title:'Tạo thẻ từ đoạn văn',type:'draft',state:'Chờ',detail:'Đã tiếp nhận yêu cầu'};list.unshift(item);data.usage++;}const before=item.state;item.state=AI_STATE[r.trangThai]||r.trangThai;item.detail=r.trangThai==='HOAN_TAT'?r.banNhap.length+' thẻ nháp chờ kiểm tra':r.maLoi?('Mã lỗi '+r.maLoi):item.detail;if(r.trangThai==='LOI'&&before!=='Lỗi')data.usage=Math.max(0,data.usage-1);save();}
  function aiDraftList(r){
    const open=r.banNhap.filter(x=>x.trangThaiDuyet==='CHO_DUYET'),missing=open.filter(x=>!x.viDuEn).length;
    const cards=r.banNhap.map(x=>`<article class="d3-card" data-draft="${e(x.id)}"><label class="choice"><input type="checkbox" name="draft" value="${e(x.id)}" ${x.trangThaiDuyet!=='CHO_DUYET'?'disabled':x.trung?'':'checked'}><span class="bubble" aria-hidden="true"></span><span>Thẻ ${x.thuTu}</span></label><h3 class="en">${e(x.tu)}${x.tuLoai?' <span class="small muted">'+e(x.tuLoai)+'</span>':''}</h3><p>${e(x.nghiaVi)}</p>${x.viDuEn?'<p class="en d3-quote">'+e(x.viDuEn)+'</p>':'<p class="small muted">Chưa có câu ví dụ</p>'}${x.trung?stamp('Đã có trong bộ','warning'):''}${x.trangThaiDuyet==='DA_LUU'?stamp('Đã lưu'):''}${x.trangThaiDuyet==='CHO_DUYET'?`<div class="d3-draft-fields d3-stack" id="edit-${e(x.id)}" hidden>${field('Từ tiếng Anh','tu-'+x.id,x.tu,'text','maxlength="100" required')}${field('Từ loại','loai-'+x.id,x.tuLoai||'','text','maxlength="30"')}${textarea('Nghĩa tiếng Việt','nghia-'+x.id,x.nghiaVi,'maxlength="500" required')}${field('Câu ví dụ','vidu-'+x.id,x.viDuEn||'','text','maxlength="300"')}${field('Bản dịch ví dụ','dich-'+x.id,x.dichVi||'','text','maxlength="300"')}</div>`:''}<div class="d3-actions">${x.trangThaiDuyet==='CHO_DUYET'?b(icon('edit')+'Sửa trước khi lưu','edit-ai','edit',`data-draft-id="${e(x.id)}" aria-expanded="false" aria-controls="edit-${e(x.id)}"`):''}${b(icon('volume')+'Đọc từ','speak','media',`data-word="${e(x.tu)}"`)}</div></article>`).join('');
    const target=open.length?`<fieldset class="d3-stack d3-card"><legend>Lưu vào bộ thẻ</legend><label class="choice"><input type="radio" name="commit-target" value="deck" checked><span class="bubble" aria-hidden="true"></span><span>Bộ có sẵn</span></label>${select('Bộ thẻ có sẵn','commit-deck',[['','Chọn bộ thẻ'],...aiDecks()])}<label class="choice"><input type="radio" name="commit-target" value="new"><span class="bubble" aria-hidden="true"></span><span>Bộ mới (riêng tư)</span></label>${field('Tên bộ mới','commit-name','','text','maxlength="150" disabled')}</fieldset><div class="d3-footer"><span id="selected-count"></span>${b('Lưu thẻ đã chọn','commit','primary','id="commit"')}</div>`:'';
    return notice('Bản nháp mô phỏng · '+e(r.model||'fake')+' · '+e(r.phienBanPrompt)+'. Kiểm tra nghĩa trước khi lưu; bấm "Sửa trước khi lưu" để chỉnh từng thẻ.')+(missing?notice(missing+' thẻ chưa có ví dụ.','warning'):'')+`<div class="d3-drafts d3-stack">${cards}</div>`+target;
  }
  function aiCount(){const count=root.querySelectorAll('[name="draft"]:checked').length,commit=document.getElementById('commit');if(!commit)return;document.getElementById('selected-count').textContent=count+' thẻ đang chọn';commit.disabled=!count;commit.textContent='Lưu '+count+' thẻ đã chọn';}
  function aiShow(r){
    const target=document.getElementById('output');if(!target)return;aiCurrent=r.id;aiLast=r;aiTrack(r);
    if(r.trangThai==='CHO'||r.trangThai==='DANG_XU_LY'){target.innerHTML=notice((r.trangThai==='CHO'?'Đã nhận yêu cầu · chờ xử lý':'Đang xử lý')+'. Bạn có thể rời trang; kết quả nằm trong Lịch sử AI.')+b('Dừng theo dõi','cancel-task','quiet');message(AI_STATE[r.trangThai]+'…');return;}
    clearTimeout(aiPoll);aiPoll=null;data.aiRequestId=null;save();
    if(r.trangThai==='HOAN_TAT'){target.innerHTML=aiDraftList(r);aiCommitKey=null;aiCount();message('Đã có '+r.banNhap.length+' thẻ nháp. Kiểm tra trước khi lưu.');focusOutput();return;}
    if(r.trangThai==='KHONG_XAC_DINH'){target.innerHTML=notice('Chưa xác định kết quả ('+e(r.maLoi||'')+'). Hệ thống không tự gửi lại và lượt AI này đã được tính; nếu thử lại sẽ dùng thêm một lượt.','warning')+link('Xem lịch sử','ai-lich-su.html');message('Chưa xác định kết quả');return;}
    window.VocabMascot?.react('error');target.innerHTML=notice(e(AI_ERROR[r.maLoi]||'AI không xử lý được yêu cầu.')+' Lượt AI đã được hoàn lại; đoạn văn của bạn vẫn được giữ.','danger');message('AI lỗi · mã '+(r.maLoi||''));
  }
  async function aiWatch(id){clearTimeout(aiPoll);try{const r=await VL.api('GET','/ai/requests/'+encodeURIComponent(id));aiShow(r);if(r.trangThai==='CHO'||r.trangThai==='DANG_XU_LY')aiPoll=setTimeout(()=>aiWatch(id),900);}catch(error){message(error.message);}}
  const renders = {
    'ai-xuong-the':()=>`<div class="d3-workspace"><form id="draft-form" class="d3-stack" novalidate>${textarea('Đoạn văn tiếng Anh','passage',source,'required maxlength="5000" aria-describedby="passage-hint"')}<p id="passage-hint" class="muted small">Tối đa 5.000 ký tự, tạo tối đa 50 thẻ nháp. Thêm <code>#mo-phong:LOI</code>, <code>#mo-phong:TIMEOUT</code> hoặc <code>#mo-phong:SAI_SCHEMA</code> vào đoạn văn để xem trạng thái lỗi.</p>${field('Đọc đoạn văn từ tệp .txt hoặc .csv','passage-file','','file','accept=".txt,.csv,text/plain,text/csv" aria-describedby="file-hint"')}<p id="file-hint" class="muted small">Tệp được đọc ngay trên trình duyệt. Tệp Word (.docx) tải lên máy chủ thật rồi gửi <code>tepId</code>.</p>${select('Bộ thẻ để kiểm tra trùng (không bắt buộc)','deck',[['','Không kiểm tra trùng'],...aiDecks()])}<button class="btn btn-primary" type="submit">Tạo bản nháp</button><p class="muted small">Nội dung gốc không bị thay đổi. Thẻ chưa được lưu tự động.</p>${link('Lịch sử và hạn mức','ai-lich-su.html','quiet')}</form>${output('Thẻ nháp sẽ nằm ở đây')}</div>`,
    'ai-viet-cau':()=>`<div class="d3-workspace"><form id="sentence-form" class="d3-stack" novalidate>${field('Từ muốn vận dụng','tu',new URLSearchParams(location.search).get('word')||'receipt','text','required maxlength="100" autocomplete="off"')}${textarea('Câu tiếng Anh của bạn','cau','i have keep the reciept yesterday','required maxlength="500"')}<button type="submit" class="btn btn-primary">Nhận phản hồi</button><p class="muted small">Giải thích bằng tiếng Việt. Phản hồi AI là gợi ý tham khảo, không phải điểm kiểm tra; mỗi lần gửi dùng 1 lượt AI.</p></form>${output('Câu sửa và giải thích')}</div>`,
    'ai-giai-thich':()=>{const c=contextCard();return `<section class="d3-record"><p class="caption">Mặt thẻ · ví dụ trong ngữ cảnh</p><h2 class="word" lang="en">${e(c.word)}</h2>${c.exampleEn?`<p class="d3-quote" lang="en">${e(c.exampleEn)}</p>`:''}<p>${e(c.meaningVi)}</p><div class="d3-actions">${c.exampleEn?b(icon('volume')+'Đọc câu ví dụ','speak','media',`data-word="${e(c.exampleEn)}"`):''}${b('Giải thích câu này','context-open','primary')}</div></section><p class="muted small" style="margin-top:var(--sp-4)">Ngăn giải thích mở cạnh thẻ, giữ nguyên phiên học. Đóng ngăn để tiếp tục học.</p>`;},
    'ai-lich-su':()=>`<div id="quota-box" aria-live="polite"></div><form class="d3-filter" id="history-filter">${select('Loại yêu cầu','history-type',[['','Tất cả'],['TAO_THE','Tạo thẻ'],['NGU_CANH','Giải thích ngữ cảnh'],['SUA_CAU','Sửa câu'],['ANH_THE','Ảnh minh họa']])}<button type="submit" class="btn btn-secondary">Lọc</button></form><div id="history-list" aria-live="polite"></div><nav class="pager" id="history-pager" aria-label="Phân trang lịch sử"></nav>`,
    'goi-y':()=>`<section class="d3-section" aria-labelledby="rec-todo-title"><h2 id="rec-todo-title">Nên làm tiếp</h2><p class="small muted">Xếp theo mức ưu tiên. Mỗi từ chỉ xuất hiện ở một lý do; tối đa 2 gợi ý cho mỗi lý do.</p><div class="d3-grid" id="rec-todo" aria-live="polite">${notice('Đang tải gợi ý…')}</div></section><section class="d3-section" id="rec-progress-box" aria-labelledby="rec-progress-title" hidden><h2 id="rec-progress-title">Bạn đã tiến bộ</h2><div class="d3-grid" id="rec-progress"></div></section>`,
    'phat-am':()=>`<div class="d3-workspace"><section class="d3-stack"><form id="word-form">${select('Từ muốn luyện','pron-word',[['receipt','receipt — biên lai'],['schedule','schedule — lịch trình'],['appointment','appointment — cuộc hẹn'],...(()=>{const word=new URLSearchParams(location.search).get('word')?.trim().slice(0,100);return word&&!['receipt','schedule','appointment'].includes(word)?[[word,word+' — từ thẻ đang xem']]:[];})()])}</form><section class="d3-record"><h2 class="word" id="pron-title" lang="en">receipt</h2><p class="ipa" id="pron-ipa">/rɪˈsiːt/</p>${b(icon('volume')+'Nghe mẫu bằng giọng trình duyệt','pron-speak','media')}<p id="record-status" role="status">Chưa ghi âm · tối đa 15 giây</p><div class="d3-actions">${b('Bắt đầu ghi âm','record','primary','id="record-start"')}${b('Dừng ghi','stop-record','danger','id="record-stop" disabled')}${b('Ghi lại','reset-record','secondary','id="record-reset" disabled')}</div><audio id="record-audio" controls hidden aria-label="Phát lại bản ghi của bạn"></audio>${b('Gửi đánh giá phát âm','assess','primary','id="assess" disabled')}<p class="small muted">Micro chỉ được yêu cầu khi bấm ghi. Bản ghi được đổi sang WAV 16 kHz một kênh trước khi gửi; bạn xóa được bản ghi trong lịch sử.</p></section>${link('Lịch sử phát âm','phat-am-lich-su.html','quiet')}</section><section class="d3-stack" id="output" tabindex="-1"><div class="empty"><h2>Phản hồi phát âm</h2><p>Chỉ hiện chỉ số dịch vụ trả về; chỉ số thiếu hiển thị “Chưa có”.</p>${b('Xem kết quả mẫu','sample-assessment')}</div></section></div>`,
    'phat-am-lich-su':()=>`<div class="d3-filter">${select('Từ cần xem','record-filter',[['all','Tất cả'],['receipt','receipt'],['schedule','schedule']])}${b('So sánh 2 lượt đã chọn','compare','primary','id="compare" disabled')}</div><div id="record-list"></div><section id="comparison" class="d3-section" aria-live="polite"></section>`,
    'ban-do-lam-chu':()=>`<p class="muted">Mức độ làm chủ được xem riêng theo kỹ năng. Một câu đúng chưa đủ để đánh dấu đã vững.</p><form class="d3-filter" id="mastery-filter">${select('Bộ thẻ','mastery-deck',[['all','Tất cả bộ'],['toeic','TOEIC — công sở']])}${select('Kỹ năng','mastery-skill',[['all','Tất cả'],['meaning','Nhận nghĩa'],['spelling','Chính tả'],['speaking','Phát âm']])}<button class="btn btn-secondary">Lọc</button></form><div id="mastery-list"></div><p class="muted small">Các nhãn “Cần luyện”, “Đang củng cố”, “Vững qua nhiều lượt”, “Chưa đủ dữ liệu” luôn đi cùng màu.</p>`,
    'tong-ket-tuan':()=>`<div class="d3-filter">${select('Tuần xem tổng kết','week',[['','Tuần này'],['last','Tuần trước']])}<span class="muted small" id="weekly-zone"></span></div><div id="weekly-content" aria-live="polite"></div>`,
    'thanh-tich':()=>`<div id="reward-metrics">${notice('Đang tải thành tích…')}</div><section class="d3-section"><h2>Huy hiệu</h2><div class="d3-grid" id="badge-list"></div></section><section class="d3-section"><h2>Thử thách tuần</h2><div id="challenge-list"></div></section><section class="d3-section"><h2>Lịch sử thưởng</h2><div id="reward-history"></div></section>`,
    'thong-bao':()=>`<div class="row-between"><div class="tabs" role="tablist" aria-label="Lọc thông báo"><button type="button" class="tab" role="tab" aria-selected="true" data-notify-filter="all">Tất cả</button><button type="button" class="tab" role="tab" aria-selected="false" data-notify-filter="unread">Chưa đọc</button></div><span id="unread-count" class="muted small"></span></div><div id="notification-list"></div><div class="d3-footer">${link('Thiết lập giờ và kênh nhắc','../dot1/ca-nhan-thong-bao.html','quiet')}<p class="muted small">Đánh dấu đọc chỉ áp dụng trên dữ liệu mẫu.</p></div>`,
    'ca-nhan-du-lieu':()=>`<section class="d3-section d3-stack"><h2>Khi xóa tài khoản</h2>${table(['Dữ liệu','Xử lý'],DELETION_POLICY.map(([a,c])=>[e(a),e(c)]),'Chính sách xử lý dữ liệu khi xóa tài khoản')}${link('Đọc chính sách dữ liệu','../gd0/chinh-sach.html','quiet')}</section><section class="d3-danger d3-stack" id="deletion-zone"><h2>Xóa tài khoản</h2><p>Gửi yêu cầu là khóa đăng nhập ngay và đăng xuất mọi thiết bị. Không thể hoàn tác.</p><div id="deletion-status"></div>${b('Xem phạm vi và tiếp tục','deletion-open','danger')}</section>`,
    'bao-cao-noi-dung':()=>`<p>Chọn nội dung muốn báo cáo. Bạn chỉ báo cáo được bộ, thẻ công khai của người khác và đầu ra AI đã hoàn tất của chính mình.</p><div id="report-targets" aria-live="polite">${notice('Đang tải nội dung…')}</div>`,
    'quan-tri-tong-quan':()=>`${metrics([[data.reports.filter(x=>x.state==='Chờ xử lý').length,'Báo cáo chờ xử lý'],[data.deletion?1:0,'Yêu cầu xóa mẫu'],['3','Tác vụ chờ/đang chạy'],['Chưa xác định','Chi phí · thiếu đơn giá']])}<section class="d3-section"><h2>Cần kiểm tra</h2><div class="d3-grid"><article class="d3-card"><h3>Hàng đợi nội dung</h3><p>Kiểm tra bằng chứng và ghi lý do trước khi quyết định.</p>${link('Mở báo cáo','quan-tri-bao-cao.html','primary')}</article><article class="d3-card"><h3>Dịch vụ bên ngoài</h3><p>Một yêu cầu AI chưa xác định kết quả; không gửi lại tự động.</p>${link('Xem tác vụ nền','quan-tri-tac-vu.html')}</article></div></section><section class="d3-section"><h2>Yêu cầu xóa dữ liệu</h2>${table(['Yêu cầu','Ngày','Trạng thái','Phạm vi'],[['DEL-102','12/10/2026',stamp(data.deletion||'Chưa có yêu cầu'),'Dữ liệu riêng; ẩn danh nội dung công khai']],'Theo dõi xử lý mẫu')}<p class="small muted">Không có nút xác nhận xóa thay người dùng. Tiến độ thực tế do tác vụ nền trả về.</p></section>`,
    'quan-tri-bao-cao':()=>`<div class="d3-filter">${select('Trạng thái','report-state',[['CHO_XU_LY','Chờ xử lý'],['','Tất cả'],['DA_GIU','Đã giữ'],['DA_AN','Đã ẩn']])}</div><div id="report-list" aria-live="polite"></div>`,
    'quan-tri-dich-vu':()=>`<section class="d3-section"><h2>Sử dụng dịch vụ</h2><div id="ops-usage" aria-live="polite">${notice('Đang tải lượt dùng…')}</div></section><section class="d3-section"><h2>Hạn mức theo gói, mỗi người mỗi ngày</h2><form id="quota-form" class="d3-stack" novalidate><div id="quota-fields">${notice('Đang tải hạn mức…')}</div>${textarea('Lý do thay đổi','quota-reason','','required minlength="10" maxlength="500"')}<button type="submit" class="btn btn-primary">Lưu hạn mức</button></form></section>`,
    'quan-tri-thong-bao':()=>`<div class="d3-workspace"><form id="announcement-form" class="d3-stack">${field('Tiêu đề thông báo','announcement-title','','text','required maxlength="120"')}${textarea('Nội dung','announcement-body','','required maxlength="1000"')}${select('Người nhận','audience',[['active','Người học đang hoạt động'],['all','Tất cả người học']])}<button type="submit" class="btn btn-primary">Xem trước thông báo</button><p class="small muted">Chỉ gửi sau bước xác nhận. Không có thông báo/email thật được gửi trong mockup.</p></form><section class="d3-stack"><h2>Thông báo đã gửi trong mẫu</h2><div id="announcements"></div></section></div>`,
    'quan-tri-tac-vu':()=>`<div class="tabs"><a class="tab" href="../dot2/quan-tri-nhat-ky.html?as=admin">Nhật ký quản trị</a><span class="tab" aria-current="page">Tác vụ nền</span></div><form id="job-filter" class="d3-filter">${select('Trạng thái','job-state',[['all','Tất cả'],['CHO','Chờ'],['DANG_CHAY','Đang chạy'],['LOI','Lỗi'],['KHONG_XAC_DINH','Chưa xác định'],['XONG','Hoàn tất']])}<button class="btn btn-secondary">Lọc</button></form><div id="job-list"></div><p class="small muted">Số lần thử và lịch thử tiếp do worker quyết định. Không có nút chạy lại một yêu cầu chưa rõ kết quả.</p>`,
    'quan-tri-dong-luc':()=>`<div class="row-between"><div class="tabs" role="tablist" aria-label="Danh mục động lực"><button type="button" class="tab" role="tab" aria-selected="true" data-motivation="badges">Huy hiệu</button><button type="button" class="tab" role="tab" aria-selected="false" data-motivation="challenges">Thử thách</button></div>${b(icon('plus')+'Tạo mục mới','motivation-new','primary')}</div><div id="motivation-list"></div><p class="small muted">Điều kiện thưởng phải được backend kiểm tra. Thao tác mẫu không cộng điểm cho người học.</p>`
  };
  let notificationFilter='all', motivationKind='badges', historyPage=0;
  const AI_LOAI={TAO_THE:'Tạo thẻ',NGU_CANH:'Giải thích ngữ cảnh',SUA_CAU:'Sửa câu',ANH_THE:'Ảnh minh họa'};
  const AI_LINK={TAO_THE:'ai-xuong-the.html',NGU_CANH:'ai-giai-thich.html',SUA_CAU:'ai-viet-cau.html'};
  const QUOTA_NAME={AI:'AI văn bản',ANH:'Ảnh AI',TTS:'Âm thanh TTS',PHAT_AM:'Đánh giá phát âm'};
  const LOI_LOAI={NGU_PHAP:'Ngữ pháp',CHINH_TA:'Chính tả',TU_VUNG:'Từ vựng',PHONG_CACH:'Gợi ý văn phong'};
  const aiStamp=s=>stamp(AI_STATE[s]||s,s==='LOI'?'danger':s==='KHONG_XAC_DINH'?'warning':s==='HOAN_TAT'?'success':'quiet');
  function contextCard(){const w=(new URLSearchParams(location.search).get('word')||'receipt').toLowerCase();return VLDemo.db.cards.find(c=>!c.deleted&&c.word.toLowerCase()===w)||{word:w,meaningVi:'Chưa có nghĩa đã lưu',exampleEn:''};}
  let aiTaskSeq=0;
  async function aiRun(path,body,form,target,show){
    const my=++aiTaskSeq,submit=form.querySelector('[type="submit"]');
    VLDemo.flags.aiMode=mode()==='error'?'LOI':mode()==='unknown'?'TIMEOUT':null;VLDemo.flags.aiQuotaFull=mode()==='quota';
    VL.clearErrors(form);submit.disabled=true;submit.setAttribute('aria-busy','true');
    try{
      const accepted=await VL.api('POST',path,body);
      target.innerHTML=notice('Đã nhận yêu cầu · '+AI_STATE[accepted.trangThai]+'. Kết quả hiện ở đây khi xong.');message('Đang chờ xử lý…');
      for(let i=0;i<40;i++){
        await new Promise(r=>setTimeout(r,900));if(my!==aiTaskSeq||!target.isConnected)return;
        const r=await VL.api('GET','/ai/requests/'+encodeURIComponent(accepted.requestId));
        if(r.trangThai==='CHO'||r.trangThai==='DANG_XU_LY'){target.innerHTML=notice(AI_STATE[r.trangThai]+'…');continue;}
        if(r.trangThai==='HOAN_TAT'){target.innerHTML=r.ketQua?show(r.ketQua,r):notice('Kết quả đã bị ẩn sau kiểm duyệt.','warning');message('Đã có phản hồi. Kiểm tra lại trước khi dùng.');target.focus?.();return;}
        if(r.trangThai==='LOI'){window.VocabMascot?.react('error');target.innerHTML=notice(e(AI_ERROR[r.maLoi]||'AI xử lý lỗi ('+(r.maLoi||'không rõ')+').')+' Lượt AI đã được hoàn lại; nội dung bạn nhập vẫn giữ nguyên, có thể gửi lại.','danger');message('AI xử lý lỗi');return;}
        target.innerHTML=notice('Chưa xác định kết quả ('+e(r.maLoi||'')+'). Lượt AI này đã được tính; đừng gửi lại ngay, xem trạng thái trong lịch sử.','warning')+link('Xem lịch sử AI','ai-lich-su.html');message('Chưa xác định kết quả');return;
      }
      target.innerHTML=notice('Đã dừng theo dõi sau một phút. Yêu cầu vẫn có thể hoàn tất; xem lại trong lịch sử AI.','warning')+link('Xem lịch sử AI','ai-lich-su.html');
    }catch(err){
      if(err.status===400&&err.fieldErrors?.length){VL.showErrors(form,err);message(err.message);}
      else if(err.status===429){const h=err.retryAfter?Math.ceil(err.retryAfter/3600):null;target.innerHTML=notice(e(err.message)+(h?' Dùng lại sau khoảng '+h+' giờ (00:00 giờ Việt Nam).':'')+' Học SRS và bài cố định không bị khóa.','warning')+link('Xem hạn mức','ai-lich-su.html','quiet');message(err.message);}
      else if(err.status===402){target.innerHTML=notice(e(err.message),'warning')+link('Xem gói dịch vụ','thanh-toan-goi.html');message(err.message);}
      else{target.innerHTML=notice(e(err.message)+(err.requestId?' · Mã '+e(err.requestId):''),'danger');message(err.message);}
    }finally{if(my===aiTaskSeq){submit.disabled=false;submit.removeAttribute('aria-busy');}}
  }
  function sentenceView(k){
    const errs=k.loi.filter(x=>x.loai!=='PHONG_CACH'),tips=k.loi.filter(x=>x.loai==='PHONG_CACH');
    const item=x=>`<li><strong>${e(LOI_LOAI[x.loai]||x.loai)}:</strong> <span class="en">${e(x.doanGoc)}</span> → <span class="en">${e(x.doanSua)}</span> — ${e(x.giaiThich)}</li>`;
    return notice('Phản hồi AI mô phỏng · gợi ý tham khảo, không phải cách viết đúng duy nhất')+`<div class="d3-card d3-stack"><h3>Câu bạn viết</h3><p class="en d3-quote">${e(k.cauGoc)}</p><h3>Bản sửa tham khảo</h3><p class="en d3-quote">${e(k.cauSua)}</p><p>${stamp(k.dungTuMucTieu?'Đã dùng từ mục tiêu':'Chưa dùng từ mục tiêu',k.dungTuMucTieu?'success':'warning')}</p>${errs.length?`<h3>Lỗi (${errs.length})</h3><ul class="d3-evidence">${errs.map(item).join('')}</ul>`:'<p>Không có lỗi ngữ pháp, chính tả hay dùng từ.</p>'}${tips.length?`<h3>Gợi ý (${tips.length})</h3><ul class="d3-evidence">${tips.map(item).join('')}</ul>`:''}<h3>Nhận xét</h3><p>${e(k.nhanXet)}</p>${k.cachDungTu?`<h3>Cách dùng từ</h3><p>${e(k.cachDungTu)}</p>`:''}<div class="d3-actions">${b('Báo cáo phản hồi','report-open','secondary','data-kind="AI" data-target="Phản hồi viết câu"')}</div></div>`;
  }
  function contextView(k){
    const row=(t,v,en)=>v?`<dt>${t}</dt><dd${en?' class="en" lang="en"':''}>${e(v)}</dd>`:'';
    return notice('Gợi ý AI, chưa kiểm chứng như từ điển. Ngăn này không thay đổi nghĩa đã lưu trên thẻ.')+`<div class="d3-stack"><h3 lang="en">${e(k.tu)}${k.phienAm?` <span class="muted">${e(k.phienAm)}</span>`:''}${k.tuLoai?` <span class="muted">· ${e(k.tuLoai)}</span>`:''}</h3><p><strong>${e(k.nghiaVi)}</strong></p><p>${e(k.giaiThich)}</p><dl class="kv">${row('Câu liên quan',k.doanLienQuan,true)}${row('Ví dụ',k.viDuEn,true)}${row('Dịch',k.dichVi)}${row('Mẹo nhớ',k.meoNho)}</dl>${link('Báo cáo đầu ra','bao-cao-noi-dung.html','quiet')}</div>`;
  }
  async function history() {
    const quotaBox=document.getElementById('quota-box'),list=document.getElementById('history-list'),pager=document.getElementById('history-pager');
    list.innerHTML='<p class="muted" role="status">Đang tải lịch sử…</p>';
    try{
      const q=await VL.api('GET','/me/service-quota');
      quotaBox.innerHTML=(q.goiMa?'':notice('Chưa có gói đang hiệu lực nên hạn mức bằng 0.','warning'))+metrics(q.hanMuc.map(x=>[x.conLai+' / '+x.gioiHan,QUOTA_NAME[x.loai]+' còn lại'+(x.soGiu?' · '+x.soGiu+' đang giữ':'')]))+`<p class="muted small">Gói ${e(q.goiMa||'—')} · ngày ${e(q.ngay)} · làm mới lúc ${e(VL.fmtDateTime(q.datLaiAt))}. Yêu cầu lỗi được hoàn lượt; “Chưa xác định” vẫn tính lượt.</p>`;
    }catch(err){quotaBox.innerHTML=notice(e(err.message),'danger');}
    try{
      const type=document.getElementById('history-type').value;
      const d=await VL.api('GET','/ai/history?page='+historyPage+'&size=10'+(type?'&loai='+type:''));
      if(!d.items.length){list.innerHTML='<div class="empty"><h2>Chưa có yêu cầu AI</h2><p>Thử giải thích ngữ cảnh, sửa câu hoặc tạo thẻ từ đoạn văn.</p>'+link('Viết câu dùng thử','ai-viet-cau.html')+'</div>';pager.innerHTML='';return;}
      list.innerHTML=table(['Thời gian','Loại','Nội dung','Trạng thái',''],d.items.map(x=>[e(VL.fmtDateTime(x.createdAt)),e(AI_LOAI[x.loai]||x.loai)+(x.moPhong?' <small class="muted">· mô phỏng</small>':''),x.loai==='TAO_THE'?'<span class="muted">Đoạn văn</span>':`<span class="en">${e(x.inputRef)}</span>`,aiStamp(x.trangThai)+(x.maLoi?` <small class="muted">${e(x.maLoi)}</small>`:'')+(x.anKiemDuyet?' '+stamp('Đã ẩn','warning'):''),b('Chi tiết','ai-detail','secondary',`data-ai-id="${e(x.id)}"`)]),'Lịch sử yêu cầu AI');
      pager.innerHTML=VL.pagination(d.page,d.totalPages);
    }catch(err){list.innerHTML=notice(e(err.message)+(err.requestId?' · Mã '+e(err.requestId):''),'danger')+b('Thử lại','retry','secondary');pager.innerHTML='';}
  }
  async function records() {
    const filter=document.getElementById('record-filter').value,card=filter==='all'?null:pronCard(filter);
    const list=document.getElementById('record-list');
    if(filter!=='all'&&!card){historyItems=[];list.innerHTML='<p class="muted">Chưa có thẻ cho từ này.</p>';return;}
    try{const page=await VL.api('GET','/pronunciation/history?size=50'+(card?'&theId='+encodeURIComponent(card.id):''));historyItems=page.items;}catch(error){list.innerHTML=notice(e(error.message),'danger');return;}
    list.innerHTML=historyItems.length?table(['Chọn','Từ/ngày','Tổng điểm','Độ chính xác','Độ trôi chảy',''],historyItems.map(x=>['<label class="choice"><input type="checkbox" name="compare-record" value="'+e(x.id)+'" aria-label="Chọn lượt '+e(x.vanBanMau)+'"><span class="bubble" aria-hidden="true"></span></label>','<span lang="en">'+e(x.vanBanMau)+'</span><br><span class="muted">'+e(new Date(x.createdAt).toLocaleString('vi-VN'))+(x.moPhong?' · Mô phỏng':'')+'</span>',score(x.tongDiem),score(x.doChinhXac),score(x.doTroiChay),x.tepGhiAmId?b('Xóa bản ghi','delete-record','danger','data-id="'+e(x.tepGhiAmId)+'"'):'<span class="muted">Đã xóa bản ghi</span>']),'Chỉ hiện chỉ số dịch vụ trả về'):'<div class="empty"><h2>Chưa có lượt luyện</h2><p>Ghi âm ở góc phát âm để có lịch sử.</p>'+link('Luyện phát âm','phat-am.html','primary')+'</div>';
  }
  function mastery() {
    const selected=document.getElementById('mastery-skill').value;
    const skills=[['meaning','Nhận nghĩa','Vững qua nhiều lượt',.8,'steady','4/5 lượt gần đây đúng'],['spelling','Chính tả','Cần luyện',.4,'low','Sai 3/5 lượt gần đây'],['speaking','Phát âm','Chưa đủ dữ liệu',0,'unknown','Chưa có lượt đánh giá được xác nhận']].filter(x=>selected==='all'||x[0]===selected);
    document.getElementById('mastery-list').innerHTML=`<div class="d3-grid">${['receipt','appointment','schedule'].map(w=>`<article class="d3-card"><h3 class="word" lang="en">${w}</h3>${skills.map(([k,t,l,n,c,ev])=>`<div class="d3-skill" data-level="${c}"><div class="row-between"><strong>${t}</strong><span class="small">${l}</span></div><div class="meter" aria-hidden="true"><span style="--v:${n}"></span></div><p class="small muted">Bằng chứng mẫu: ${ev}</p></div>`).join('')}${link('Luyện lại từ này','../dot2/hoc.html','accent')}</article>`).join('')}</div>`;
  }
  const SKILL_NAME={NHAN_NGHIA:'Nhận nghĩa',VIET:'Viết',NGHE:'Nghe',NGU_CANH:'Ngữ cảnh',CAP_NHAM:'Phân biệt từ dễ nhầm'};
  const apiError=(title,err)=>`<div class="error-state" role="alert"><h3>${e(title)}</h3><p>${e(err.message||'Kết nối bị gián đoạn.')} Thử tải lại trang.</p><p class="request-id">Mã hỗ trợ: ${e(err.requestId||'—')}</p></div>`;
  async function weekly() {
    const target=document.getElementById('weekly-content');
    if(mode()==='loading'){target.innerHTML=notice('Đang tải tổng kết tuần…');return;}
    const last=document.getElementById('week').value==='last';
    const day=new Date(Date.now()-(last?7:0)*864e5);
    const ngay=last?`${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,'0')}-${String(day.getDate()).padStart(2,'0')}`:'';
    try {
      if(mode()==='error')throw Object.assign(new Error('Máy chủ mẫu đang lỗi.'),{requestId:'demo-weekly'});
      const r=await VL.api('GET','/statistics/weekly-summary'+(ngay?'?ngay='+ngay:''));
      document.getElementById('weekly-zone').textContent=`${r.tuNgay} → ${r.denNgay} · theo ${r.muiGio}`;
      if(mode()==='empty'||(!r.soLuotOn&&!r.soCauLuyen)){target.innerHTML=`<div class="empty"><h2>${e(r.tomTat)}</h2><p>Ôn vài thẻ hoặc làm một bài luyện để có tổng kết tuần.</p>${link('Học hôm nay','../dot2/hom-nay.html','accent')}</div>`;return;}
      const tienBo=r.kyNang.filter(k=>k.tienBo);
      const chuaDu=r.kyNang.filter(k=>!k.duDuLieu).map(k=>SKILL_NAME[k.kyNang]);
      target.innerHTML=metrics([[r.soTuMoi,'Từ mới đã học'],[r.soLuotOn,'Lượt ôn hợp lệ'],[r.soNgayCoHoc+' / 7','Ngày học hợp lệ'],[r.soCauLuyen,'Câu luyện đã làm']])
        +`<section class="d3-section"><h2>Tóm tắt</h2><p>${e(r.tomTat)}</p><p class="small muted">Câu tóm tắt dựng từ số liệu học, không dùng AI.</p></section>`
        +`<section class="d3-section"><h2>Kỹ năng tiến bộ</h2>${tienBo.length?table(['Kỹ năng','Tuần trước','Tuần này'],tienBo.map(k=>[e(SKILL_NAME[k.kyNang]),`${k.tyLeDungTuanTruoc}% · ${k.soQuanSatTuanTruoc} câu`,`${k.tyLeDung}% · ${k.soQuanSat} câu`]),'Tỷ lệ đúng bài luyện so với tuần trước'):notice('Chưa có kỹ năng nào tiến bộ rõ so với tuần trước.')}${chuaDu.length?`<p class="small muted">Chưa đủ dữ liệu để so sánh (cần ít nhất 5 câu mỗi tuần): ${e(chuaDu.join(', '))}.</p>`:''}</section>`
        +`<section class="d3-section"><h2>Ba từ cần chú ý</h2>${r.tuKho.length?table(['Từ','Bằng chứng','Bước tiếp theo'],r.tuKho.map(x=>[`<span><span class="word" lang="en">${e(x.tu)}</span><br><span class="small muted">${e(x.tenBo)}</span></span>`,`Sai hoặc quên ${x.soLanSai}/${x.soLuot} lượt trong tuần`,link('Ôn lại','../dot2/hoc.html','accent')]),'Từ khó trong tuần, lấy từ lượt ôn và bài luyện'):notice('Tuần này chưa có từ nào bị quên hoặc làm sai.')}</section>`
        +`<section class="d3-section"><h2>Từ đã vượt qua</h2>${r.tuDaVuotQua.length?`<ul class="d3-stack">${r.tuDaVuotQua.map(x=>`<li>${e(x.message)}</li>`).join('')}</ul>`:'<p class="muted">Chưa có từ nào từng khó mà nay đúng liên tục.</p>'}</section>`
        +`<section class="d3-section"><h2>Tuần sau, giữ mục tiêu vừa sức</h2><p>${e(r.mucTieuTuanSau.vanBan)}</p><p class="small muted">Gợi ý theo số ngày bạn đã học tuần này; bạn quyết định có đổi kế hoạch hay không.</p>${link('Xem thiết lập học','../dot1/ca-nhan-hoc-tap.html')}</section>`;
    } catch(err) { target.innerHTML=apiError('Chưa tải được tổng kết tuần',err); }
  }
  async function notifications() {
    const all=await VL.api('GET','/notifications?size=50');
    const view=notificationFilter==='all'?all:await VL.api('GET','/notifications?chuaDoc=true&size=50');
    const unread=all.soChuaDoc;
    document.getElementById('unread-count').textContent=unread+' chưa đọc';
    document.querySelectorAll('[data-notify-filter]').forEach(x=>x.setAttribute('aria-selected',String(x.dataset.notifyFilter===notificationFilter)));
    const hrefOf=l=>({'/hom-nay':'../dot2/hom-nay.html'})[l]||'thong-bao.html';
    const list=view.thongBao.items;
    document.getElementById('notification-list').innerHTML=list.length?list.map(x=>`<article class="d3-notification" data-unread="${!x.daDocAt}">${icon('bell')}<div class="d3-stack"><h3>${e(x.tieuDe)}</h3><p>${e(x.noiDung)}</p><a class="btn btn-quiet" data-notification-open="${e(x.id)}" href="${e(hrefOf(x.lienKet))}">Xem nội dung</a><span class="small muted">${x.daDocAt?'Đã đọc':'Chưa đọc'} · ${e(VL.fmtDay(x.ngayDiaPhuong))}</span></div>${x.daDocAt?'':b('Đánh dấu đã đọc','notify-read','secondary',`data-id="${e(x.id)}"`)}</article>`).join(''):notice(notificationFilter==='all'?'Chưa có thông báo nào.':'Không còn thông báo chưa đọc.');
    document.querySelectorAll('[data-unread-badge]').forEach(x=>x.textContent=unread);
    document.querySelector('.header-actions a[href*="thong-bao.html"]')?.setAttribute('aria-label','Thông báo, '+unread+' chưa đọc');
  }
  const DELETION_POLICY=[['Tiến độ học, lịch sử ôn, bài luyện, sổ tay, điểm, huy hiệu, thông báo','Xóa'],['Yêu cầu AI, thẻ nháp, kết quả phát âm và bản ghi âm','Xóa'],['Bộ thẻ riêng tư và tệp riêng','Xóa; bản sao người khác đã tạo vẫn giữ'],['Bộ thẻ đang công khai','Giữ, tác giả hiện "Người dùng đã xóa"'],['Gói dịch vụ','Kết thúc ngay, không hoàn tiền'],['Giao dịch thanh toán','Giữ để đối soát, không còn gắn email của bạn'],['Email, tên, mật khẩu, ảnh đại diện','Xóa; email có thể đăng ký lại']];
  function deletion() { const me=VL.me();document.getElementById('deletion-status').innerHTML=me&&me.vaiTro.includes('ADMIN')?notice('Tài khoản quản trị: nếu bạn là quản trị viên cuối cùng, yêu cầu sẽ bị từ chối. Hãy cấp quyền quản trị cho người khác trước.','warning'):''; }
  function deletionDone(r) {
    const zone=document.getElementById('deletion-zone');
    zone.innerHTML=`<h2 tabindex="-1">Đã nhận yêu cầu xóa tài khoản</h2><dl class="kv"><dt>Mã yêu cầu</dt><dd>${e(r.id)}</dd><dt>Phạm vi</dt><dd>${r.phamVi==='TAI_KHOAN'?'Toàn bộ tài khoản':e(r.phamVi)}</dd><dt>Trạng thái</dt><dd>${stamp(r.trangThai==='CHO_XU_LY'?'Chờ xử lý':r.trangThai,'warning')}</dd><dt>Gửi lúc</dt><dd>${e(VL.fmtDateTime(r.yeuCauAt))}</dd></dl>${notice('Bạn đã được đăng xuất. Email xác nhận sẽ gửi khi xóa xong. Đăng nhập lại sẽ báo tài khoản bị khóa.','warning')}<div class="d3-actions">${link('Về trang đăng nhập','../dot1/dang-nhap.html','secondary')}${b('Khôi phục dữ liệu mẫu','deletion-restore','quiet')}</div>`;
    zone.querySelector('h2').focus();
  }
  const REPORT_KIND={BO_THE:'Bộ thẻ',THE_TU_VUNG:'Thẻ từ vựng',YEU_CAU_AI:'Đầu ra AI'};
  const REPORT_REASON={SAI_NOI_DUNG:'Nghĩa hoặc giải thích sai',KHONG_PHU_HOP:'Nội dung không phù hợp',KHAC:'Lý do khác'};
  const REPORT_STATE={CHO_XU_LY:['Chờ xử lý','warning'],DA_GIU:['Đã giữ','quiet'],DA_AN:['Đã ẩn','danger']};
  const SNAPSHOT_LABEL={moTa:'Mô tả',boMau:'Bộ mẫu',tu:'Từ',tuLoai:'Từ loại',nghiaVi:'Nghĩa',phienAm:'Phiên âm',viDuEn:'Ví dụ',dichVi:'Dịch ví dụ',loai:'Loại AI',inputRef:'Đầu vào',nhaCungCap:'Nhà cung cấp',model:'Model',phienBanPrompt:'Phiên bản prompt'};
  let reportList=[];
  async function reports() {
    const target=document.getElementById('report-list');
    if(mode()==='loading'){target.innerHTML=notice('Đang tải hàng đợi…');return;}
    const state=document.getElementById('report-state').value;
    try {
      if(mode()==='error')throw Object.assign(new Error('Máy chủ mẫu đang lỗi.'),{requestId:'demo-reports'});
      const r=await VL.api('GET','/admin/reports?size=50'+(state?'&trangThai='+state:''));
      reportList=mode()==='empty'?[]:r.items;
      target.innerHTML=reportList.length?table(['Nội dung','Lý do','Người báo cáo','Trạng thái',''],reportList.map(x=>[`<span><span class="small muted">${e(REPORT_KIND[x.loaiDoiTuong])} #${e(x.doiTuongId)}</span><br>${e(x.noiDung.ten)}</span>`,e(REPORT_REASON[x.lyDo]),e(x.nguoiBaoCao.tenHienThi||'—'),stamp(...REPORT_STATE[x.trangThai]),b(x.trangThai==='CHO_XU_LY'?'Xử lý':'Xem','report-review','secondary',`data-id="${e(x.id)}"`)]),state==='CHO_XU_LY'?'Báo cáo chờ xử lý, cũ trước':'Báo cáo nội dung, mới trước'):notice('Không có báo cáo ở trạng thái này.');
    } catch(err) { target.innerHTML=apiError('Chưa tải được hàng đợi báo cáo',err); }
  }
  async function reportTargets() {
    const target=document.getElementById('report-targets');
    if(mode()==='loading')return;
    try {
      if(mode()==='error')throw Object.assign(new Error('Máy chủ mẫu đang lỗi.'),{requestId:'demo-report-targets'});
      const me=VL.me();
      const decks=(await VL.api('GET','/library/decks?size=20')).items.filter(d=>d.chuSoHuuId!==me.id);
      const deck=decks[0];
      const detail=deck?await VL.api('GET','/library/decks/'+deck.id):null;
      const card=detail?.the.items[0];
      let ai=null;
      if(data.aiRequestId){try{const r=await VL.api('GET','/ai/requests/'+data.aiRequestId);if(r.trangThai==='HOAN_TAT')ai=r;}catch(_){ai=null;}}
      const cards=[deck&&['Bộ thẻ công khai',deck.ten,'BO_THE',deck.id],card&&['Thẻ từ vựng',card.tu+' — '+card.nghiaVi,'THE_TU_VUNG',card.id],ai&&['Đầu ra AI','Bản nháp thẻ AI #'+ai.id,'YEU_CAU_AI',ai.id]].filter(Boolean);
      target.innerHTML=`<div class="d3-grid">${cards.map(([t,n,k,id])=>`<article class="d3-card"><p class="caption">${t}</p><h3>${e(n)}</h3>${b('Báo cáo nội dung này','report-open','secondary',`data-kind="${k}" data-id="${e(id)}" data-target="${e(n)}"`)}</article>`).join('')}</div>${ai?'':`<p class="small muted">Chưa có đầu ra AI hoàn tất để báo cáo. ${link('Tạo thẻ bằng AI','ai-xuong-the.html','quiet')}</p>`}`;
    } catch(err) { target.innerHTML=apiError('Chưa tải được nội dung',err); }
  }
  async function services() {
    const usage=document.getElementById('ops-usage'), fields=document.getElementById('quota-fields');
    if(mode()==='loading')return;
    try {
      if(mode()==='error')throw Object.assign(new Error('Máy chủ mẫu đang lỗi.'),{requestId:'demo-ops'});
      const [u,q]=await Promise.all([VL.api('GET','/admin/service-usage'),VL.api('GET','/admin/service-quotas')]);
      const NAME={AI:'AI văn bản',ANH:'Ảnh AI',PHAT_AM:'Chấm phát âm',TTS:'Đọc mẫu'};
      const none=v=>v===null?'<span class="muted">Không ghi nhận</span>':e(v);
      usage.innerHTML=`<p class="small muted">${e(u.tuNgay)} → ${e(u.denNgay)} · ngày theo ${e(u.muiGio)}</p>`+table(['Dịch vụ','Lượt đã dùng','Đang giữ','Người dùng','Lỗi','Chưa xác định'],u.dichVu.map(x=>[e(NAME[x.loai]),e(x.soLuotDung),e(x.soDangGiu),e(x.soNguoiDung),none(x.soLoi),none(x.soKhongXacDinh)]),'Lượt dùng theo loại dịch vụ')+'<p class="small muted">Lỗi chỉ ghi nhận cho AI và ảnh. Đọc mẫu và chấm phát âm hoàn lượt ngay khi nhà cung cấp lỗi nên không lưu lượt lỗi.</p>';
      data.quotaRows=q;save();
      fields.innerHTML=['PRO','PREMIUM'].map(goi=>`<fieldset class="d3-stack"><legend><strong>Gói ${goi}</strong></legend><div class="d3-grid">${q.filter(x=>x.goiMa===goi).map(x=>field(NAME[x.loai]+' · lượt/ngày',`q-${x.goiMa}-${x.loai}`,x.soLuotNgay,'number','required min="0" max="10000"')).join('')}</div></fieldset>`).join('');
    } catch(err) { usage.innerHTML=apiError('Chưa tải được lượt dùng dịch vụ',err);fields.innerHTML=''; }
  }
  function announcements() { document.getElementById('announcements').innerHTML=data.announcements.length?data.announcements.map(x=>`<article class="d3-card"><h3>${e(x.title)}</h3><p>${e(x.body)}</p>${stamp('Đã gửi mô phỏng')}</article>`).join(''):notice('Chưa gửi thông báo nào trong phiên mô phỏng.'); }
  function jobs() {
    const rows=data.requests.map(x=>['AI-'+x.id,x.title,{'Chờ':'CHO','Đang xử lý':'DANG_CHAY','Lỗi':'LOI','Chưa xác định':'KHONG_XAC_DINH','Xong':'XONG'}[x.state]||'CHO','0','—']).concat([['JOB-01','Tạo bản nháp AI','DANG_CHAY','0','—'],['JOB-02','Tổng kết tuần','CHO','0','12/10 · 12:30'],['JOB-03','Yêu cầu AI','KHONG_XAC_DINH','1','Cần đối soát'],['JOB-04','Nhắc học','LOI','2','12/10 · 12:45']]);
    const filter=document.getElementById('job-state').value;
    document.getElementById('job-list').innerHTML=table(['Tác vụ','Loại','Trạng thái','Lần thử','Lần tiếp theo',''],rows.filter(x=>filter==='all'||x[2]===filter).map(x=>[e(x[0]),e(x[1]),stamp(x[2],x[2]==='LOI'?'danger':'quiet'),e(x[3]),e(x[4]),b('Chi tiết','job-detail','secondary',`data-title="${x[0]}" data-state="${x[2]}"`)]),'Theo dõi tác vụ mẫu · không thực thi tác vụ thật');
  }
  async function achievements() {
    const [h,badges,challenges,today]=await Promise.all([VL.api('GET','/rewards/history?size=10'),VL.api('GET','/badges'),VL.api('GET','/challenges'),VL.api('GET','/learning/today')]);
    const c=challenges[0], nhan=badges.filter(x=>x.daNhan).length;
    const nghi=today.daDungNgayNghiTuanNay?'Đã dùng ngày nghỉ tuần này ('+VL.fmtDay(today.ngayNghiDaDung,true)+'). Nghỉ thêm một ngày trong tuần sẽ đứt chuỗi.':'Mỗi tuần (thứ Hai–Chủ nhật) được nghỉ 1 ngày mà không đứt chuỗi.';
    document.getElementById('reward-metrics').innerHTML=metrics([[String(h.tongDiem),'Điểm thưởng'],[today.chuoiNgay+' ngày','Chuỗi ngày hợp lệ'],[nhan+' / '+badges.length,'Huy hiệu đã nhận'],[c?c.giaTri+' / '+c.mucTieu:'—','Lượt ôn trong thử thách']])+`<p class="small muted">Hôm nay ${h.diemHomNay} / ${h.diemToiDaNgay} điểm. ${e(nghi)}</p>`;
    document.getElementById('badge-list').innerHTML=badges.map(x=>`<article class="d3-card d3-badge">${icon('shield')}<div><h3>${e(x.ten)}</h3><p class="small muted">${e(x.moTa)}</p>${x.daNhan?stamp('Đã nhận · '+VL.fmtDate(x.nhanAt),'success'):stamp('Chưa nhận')}</div></article>`).join('');
    document.getElementById('challenge-list').innerHTML=challenges.map(x=>`<div class="d3-card"><div class="row-between"><h3>${e(x.ten)}</h3>${stamp(x.hoanThanhAt?'Đã hoàn thành':'Đang tham gia',x.hoanThanhAt?'success':'quiet')}</div><p>${x.giaTri}/${x.mucTieu} lượt ôn hợp lệ · ${VL.fmtDay(x.tuanBatDau)} – ${VL.fmtDay(x.tuanKetThuc)}</p><div class="meter is-progress" role="progressbar" aria-label="${e(x.ten)}" aria-valuenow="${x.giaTri}" aria-valuemin="0" aria-valuemax="${x.mucTieu}"><span style="--v:${Math.min(1,x.giaTri/x.mucTieu)}"></span></div><p class="muted small">${e(x.moTa)}. Điểm và điều kiện do máy chủ xác nhận.</p>${link('Bắt đầu học','../dot2/hoc.html','accent')}</div>`).join('');
    const nguon={ON_THE:'Lượt ôn thẻ',BAI_LUYEN:'Bài luyện đã nộp'};
    document.getElementById('reward-history').innerHTML=h.lichSu.items.length?table(['Ngày','Nguồn hợp lệ','Điểm'],h.lichSu.items.map(x=>[VL.fmtDay(x.ngayDiaPhuong),e(nguon[x.loaiSuKien]||x.loaiSuKien),x.soDiem<x.diemGoc?'+'+x.soDiem+' (đã chạm trần ngày)':'+'+x.soDiem]),h.lichSu.totalElements+' sự kiện thưởng, mới nhất trước'):notice('Chưa có điểm thưởng. Hoàn thành lượt ôn hoặc nộp bài luyện để nhận điểm.');
  }
  const REC_LABEL={QUEN_NHIEU:['Quên nhiều','warning'],SAI_CHINH_TA:['Sai chính tả','warning'],CAP_DE_NHAM:['Cặp dễ nhầm','warning'],PHAT_AM_THAP:['Phát âm thấp','warning'],QUA_HAN_NHIEU:['Quá hạn nhiều','warning'],TIEN_BO:['Tiến bộ','success']};
  const REC_ACTION={QUEN_NHIEU:['Ôn lại từ này','../dot2/hoc.html'],SAI_CHINH_TA:['Luyện viết','../dot2/luyen-tap.html'],CAP_DE_NHAM:['Luyện phân biệt','../dot2/luyen-tap.html'],QUA_HAN_NHIEU:['Xem kế hoạch cứu lịch','../dot2/hom-nay.html']};
  function recEvidence(x) {
    const v=x.evidence, last=v.lanCuoiAt?' · lần gần nhất '+VL.fmtDate(v.lanCuoiAt):'';
    switch(x.reasonCode){
      case 'QUEN_NHIEU':return 'Quên '+v.soLanQuen+' lần trong '+v.soNgay+' ngày'+last;
      case 'SAI_CHINH_TA':return 'Sai chính tả '+v.soSai+'/'+v.soLuot+' lượt nhập gần nhất'+last;
      case 'CAP_DE_NHAM':return 'Chọn nhầm '+v.soLanNham+' lần'+last;
      case 'QUA_HAN_NHIEU':return v.soQuaHan+' lượt quá hạn · '+v.soDenHan+' lượt đến hạn hôm nay · '+v.luotMoiNgay+' lượt/ngày ('+v.phutMoiNgay+' phút) · '+v.soNgayKeHoach+' ngày';
      case 'TIEN_BO':return 'Trước đó: sai '+v.soSaiCu+'/'+v.soLuotCu+' lượt ('+v.soNgayCu+' ngày) · Gần đây: đúng '+v.soDungMoi+'/'+v.soLuotMoi+' lượt ('+v.soNgayMoi+' ngày)';
      default:return '';
    }
  }
  function recCard(x) {
    const [label,kind]=REC_LABEL[x.reasonCode]||[x.reasonCode,'quiet'], act=REC_ACTION[x.reasonCode];
    return `<article class="d3-card">${stamp(label,kind)}<p>${e(x.message)}</p><p class="small muted"><strong>Minh chứng:</strong> ${e(recEvidence(x))}</p>${act?`<div class="d3-actions">${link(act[0],act[1])}</div>`:''}</article>`;
  }
  async function recommendations() {
    const todo=document.getElementById('rec-todo'), box=document.getElementById('rec-progress-box');
    try {
      const list=await VL.api('GET','/learning/recommendations');
      const actions=list.filter(x=>x.reasonCode!=='TIEN_BO'), wins=list.filter(x=>x.reasonCode==='TIEN_BO');
      todo.innerHTML=actions.length?actions.map(recCard).join(''):`<div class="empty"><h3>Chưa có gợi ý cần làm</h3><p>Gợi ý xuất hiện khi bạn quên một từ nhiều lần, viết sai lặp lại, hay nhầm hai từ hoặc nợ ôn vượt thời gian học mỗi ngày.</p>${link('Về Hôm nay','../dot2/hom-nay.html')}</div>`;
      box.hidden=!wins.length;
      document.getElementById('rec-progress').innerHTML=wins.map(recCard).join('');
      message(list.length?'Đã tải '+list.length+' gợi ý.':'Chưa có gợi ý.');
    } catch(err) {
      todo.innerHTML=`<div class="error-state" role="alert"><h3>Chưa tải được gợi ý</h3><p>${e(err.message||'Kết nối bị gián đoạn.')} Thử tải lại trang.</p><p class="request-id">Mã hỗ trợ: ${e(err.requestId||'—')}</p></div>`;
    }
  }
  function motivations() {
    document.querySelectorAll('[data-motivation]').forEach(x=>x.setAttribute('aria-selected',String(x.dataset.motivation===motivationKind)));
    document.getElementById('motivation-list').innerHTML=table(['Tên','Điều kiện','Trạng thái',''],data[motivationKind].map(x=>[e(x.name),e(x.rule),stamp(x.active?'Đang dùng':'Đã tắt'),`<div class="table-actions">${b('Sửa','motivation-edit','edit',`data-id="${x.id}"`)}${b(x.active?'Tắt':'Bật','motivation-toggle','secondary',`data-id="${x.id}"`)}</div>`]),'Danh mục mẫu · thay đổi không ảnh hưởng điểm thật');
  }
  function render() {
    aiTaskSeq++;
    if(mode()==='loading') { root.innerHTML='<div class="skeleton" role="status" aria-label="Đang tải mẫu"><div class="sk sk-title"></div><div class="sk sk-row"></div><div class="sk sk-row"></div></div>';message('Đang tải dữ liệu mẫu');return; }
    if(mode()==='empty') { root.innerHTML='<div class="empty"><h2>Chưa có dữ liệu</h2><p>Bắt đầu một hoạt động hoặc quay về chế độ Có dữ liệu để xem mẫu.</p>'+link('Về Hôm nay','../dot2/hom-nay.html')+'</div>';message('Không có dữ liệu mẫu');return; }
    if(mode()==='error' && !['ai-xuong-the','ai-viet-cau','phat-am','ai-giai-thich'].includes(page)) { root.innerHTML='<div class="error-state" role="alert"><h2>Chưa tải được nội dung</h2><p>Kết nối mẫu bị gián đoạn. Các chức năng học cơ bản vẫn dùng được.</p>'+b('Thử lại dữ liệu mẫu','retry','primary')+'<p class="request-id">Mã hỗ trợ mẫu: DOT3-DEMO-503</p></div>';message('Lỗi tải mẫu');return; }
    root.innerHTML=renders[page]?.()||notice('Không tìm thấy màn hình mẫu.');message('');
    const after={'ai-lich-su':history,'phat-am-lich-su':records,'ban-do-lam-chu':mastery,'tong-ket-tuan':weekly,'thong-bao':notifications,'bao-cao-noi-dung':reportTargets,'quan-tri-dich-vu':services,'ca-nhan-du-lieu':deletion,'quan-tri-bao-cao':reports,'quan-tri-thong-bao':announcements,'quan-tri-tac-vu':jobs,'quan-tri-dong-luc':motivations,'thanh-tich':achievements,'goi-y':recommendations};after[page]?.();
    if(page==='ai-xuong-the'){const deck=new URLSearchParams(location.search).get('deck');if(deck&&aiDecks().some(([v])=>v===deck))document.getElementById('deck').value=deck;if(data.aiRequestId)aiWatch(data.aiRequestId);}
    if(page==='phat-am'){const word=new URLSearchParams(location.search).get('word');const input=document.getElementById('pron-word');if([...input.options].some(x=>x.value===word)){input.value=word;input.dispatchEvent(new Event('change',{bubbles:true}));}}
    if(mode()==='quota')message('Hạn mức AI mẫu đã hết. Được dùng lại lúc 00:00 ngày mai theo Asia/Ho_Chi_Minh. Học SRS và bài cố định không bị khóa.');
  }
  let dialogSequence=0;
  function dialog(title,body,onSubmit,drawer=false) {
    const titleId='d3-dialog-title-'+(++dialogSequence);
    const d=document.createElement('dialog');d.className='d3-dialog'+(drawer?' d3-drawer':'');d.setAttribute('aria-labelledby',titleId);
    d.innerHTML=`<form><div class="row-between"><h2 id="${titleId}">${e(title)}</h2><button type="button" class="btn btn-quiet btn-icon" data-dialog-close aria-label="Đóng">${icon('x')}</button></div>${body}</form>`;
    document.body.appendChild(d);const previous=document.activeElement;
    const cleanup=()=>{d.remove();if(!document.querySelector('dialog[open]'))previous?.focus();};d.addEventListener('close',cleanup,{once:true});d.querySelector('[data-dialog-close]').onclick=()=>d.close();
    d.addEventListener('keydown',event=>{if(event.key==='Tab'){const els=[...d.querySelectorAll('button,input,select,textarea,a[href]')].filter(x=>!x.disabled&&!x.hidden);const first=els[0],last=els.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}});
    d.querySelector('form').addEventListener('submit',async event=>{event.preventDefault();if(onSubmit)await onSubmit(new FormData(event.target),d);});d.showModal();return d;
  }
  const confirmActions=(label,variant='primary')=>`<div class="d3-actions"><button type="submit" class="btn btn-${variant}">${label}</button></div>`;
  const score=v=>v===null||v===undefined?'Chưa có':Math.round(v)+' / 100';
  const diff=v=>v===null||v===undefined?'—':(v>0?'+':'')+v;
  const pronCard=word=>{const me=VL.me();return VLDemo.db.cards.find(c=>!c.deleted&&c.word===word&&VLDemo.db.decks.some(d=>d.id===c.deckId&&!d.deleted&&(d.ownerId===me?.id||d.visibility==='CONG_KHAI')));};
  async function toWav(blob){const decoded=await new AudioContext().decodeAudioData(await blob.arrayBuffer());const frames=Math.ceil(decoded.duration*16000);const offline=new OfflineAudioContext(1,frames,16000);const src=offline.createBufferSource();src.buffer=decoded;src.connect(offline.destination);src.start();const pcm=(await offline.startRendering()).getChannelData(0);const view=new DataView(new ArrayBuffer(44+pcm.length*2));const tag=(o,t)=>[...t].forEach((c,i)=>view.setUint8(o+i,c.charCodeAt(0)));tag(0,'RIFF');view.setUint32(4,36+pcm.length*2,true);tag(8,'WAVE');tag(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,16000,true);view.setUint32(28,32000,true);view.setUint16(32,2,true);view.setUint16(34,16,true);tag(36,'data');view.setUint32(40,pcm.length*2,true);pcm.forEach((x,i)=>view.setInt16(44+i*2,Math.max(-1,Math.min(1,x))*32767,true));return {blob:new Blob([view],{type:'audio/wav'}),durationMs:Math.round(decoded.duration*1000)};}
  async function assessment(file) {
    const out=document.getElementById('output'),word=document.getElementById('pron-word').value,card=pronCard(word);
    if(!card){out.innerHTML=notice('Từ “'+e(word)+'” chưa có trong bộ thẻ của bạn hoặc thư viện công khai, nên chưa chấm được.','warning');return;}
    try{
      const r=await VL.api('POST','/pronunciation/assessments',{theId:card.id,file});
      const c=r.chiSo,status={DAY_DU:'',THIEU_CHI_SO:notice('Dịch vụ không trả đủ chỉ số; ô thiếu ghi “Chưa có”.','warning'),KHONG_NHAN_DIEN:notice('Không nghe rõ tiếng nói, hãy ghi lại gần micro hơn.','warning')}[r.trangThai];
      const cmp=r.soSanh?(r.soSanh.cungThangDo?table(['Chỉ số','So với lần trước'],[['Tổng điểm',diff(r.soSanh.tongDiem)],['Độ chính xác',diff(r.soSanh.doChinhXac)],['Độ trôi chảy',diff(r.soSanh.doTroiChay)],['Độ đầy đủ',diff(r.soSanh.doDayDu)]],'Chỉ so khi cả hai lần có chỉ số'):notice('Lần trước dùng thang đo khác, không so sánh.')):'<p class="muted">Lần đầu luyện từ này, chưa có lần trước để so.</p>';
      const loi={KHONG:'Phát âm đúng',SAI:'Phát âm sai',BO_SOT:'Bỏ sót',THUA:'Đọc thừa',KHAC:'Khác'};
      out.innerHTML=(r.moPhong?notice('Mô phỏng · điểm không đến từ dịch vụ chấm thật.','warning'):'')+status+metrics([[score(c.tongDiem),'Tổng điểm'],[score(c.doChinhXac),'Độ chính xác'],[score(c.doTroiChay),'Độ trôi chảy'],[score(c.doDayDu),'Độ đầy đủ']])+'<div class="d3-card"><h3 lang="en">'+e(r.vanBanMau)+'</h3>'+c.tu.map(t=>'<p><span lang="en">'+e(t.tu)+'</span> · '+score(t.doChinhXac)+' · '+(loi[t.loi]||'Chưa có')+'</p>').join('')+(r.ghiAm?'<audio controls src="'+e(r.ghiAm.downloadUrl)+'" aria-label="Bản ghi đã gửi"></audio>':'')+'</div>'+cmp+link('Lịch sử phát âm','phat-am-lich-su.html');
      message('Đã chấm phát âm.');
    }catch(error){out.innerHTML=notice(e(error.message),'danger');message(error.message);}
  }
  let recorder,stream,recordTimer,countTimer,recordUrl,recordBlob,historyItems=[],seconds=0,recordEpoch=0,disposed=false;
  function stopTracks() { stream?.getTracks().forEach(x=>x.stop());stream=null;clearTimeout(recordTimer);clearInterval(countTimer); }
  function clearRecording() { recordEpoch++;if(recorder?.state==='recording')recorder.stop();stopTracks();if(recordUrl)URL.revokeObjectURL(recordUrl);recordUrl=null;recordBlob=null; }
  async function record() {
    if(recorder?.state==='recording')return;
    const epoch=++recordEpoch;
    const label=document.getElementById('record-status'), start=document.getElementById('record-start');start.disabled=true;
    if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){label.textContent='Trình duyệt chưa hỗ trợ ghi âm. Bạn có thể xem kết quả mẫu hoặc thử trình duyệt khác.';start.disabled=false;return;}
    try { const acquired=await navigator.mediaDevices.getUserMedia({audio:true});if(disposed||epoch!==recordEpoch||!label.isConnected){acquired.getTracks().forEach(x=>x.stop());return;}stream=acquired;const chunks=[];recorder=new MediaRecorder(stream);seconds=0;
      recorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};
      recorder.onstop=()=>{acquired.getTracks().forEach(x=>x.stop());if(epoch!==recordEpoch||disposed)return;stopTracks();if(recordUrl)URL.revokeObjectURL(recordUrl);recordBlob=new Blob(chunks,{type:recorder.mimeType});recordUrl=URL.createObjectURL(recordBlob);const audio=document.getElementById('record-audio');if(!audio)return;audio.src=recordUrl;audio.hidden=false;label.textContent='Đã ghi '+Math.min(seconds,15)+' giây. Nghe lại trước khi gửi.';document.getElementById('record-stop').disabled=true;document.getElementById('record-reset').disabled=false;document.getElementById('assess').disabled=false;};
      recorder.start();label.textContent='Đang ghi · 0/15 giây';document.getElementById('record-stop').disabled=false;countTimer=setInterval(()=>{seconds++;label.textContent='Đang ghi · '+seconds+'/15 giây';},1000);recordTimer=setTimeout(()=>{if(recorder.state==='recording')recorder.stop();},15000);
    } catch(error) { stopTracks();start.disabled=false;label.textContent=error.name==='NotAllowedError'?'Chưa được cấp quyền micro. Kiểm tra quyền trình duyệt rồi thử lại.':'Không truy cập được micro. Kiểm tra thiết bị rồi thử lại.'; }
  }
  root.addEventListener('submit',async event=>{
    event.preventDefault();const form=event.target,fd=new FormData(form),button=event.submitter;
    if(form.id==='draft-form'){
      const passage=document.getElementById('passage');let doanVan=String(fd.get('passage')||'').trim();
      if(!doanVan){passage.setCustomValidity('Nhập đoạn văn tiếng Anh');passage.reportValidity();passage.setCustomValidity('');return;}
      if(mode()==='error')doanVan+=' #mo-phong:LOI';if(mode()==='unknown')doanVan+=' #mo-phong:TIMEOUT';VLDemo.flags.aiMode=null;VLDemo.flags.aiQuotaFull=mode()==='quota';
      button.disabled=true;button.setAttribute('aria-busy','true');
      try{const body={doanVan};if(fd.get('deck'))body.boTheId=fd.get('deck');const accepted=await VL.api('POST','/ai/card-drafts',body);data.aiRequestId=accepted.requestId;save();aiShow({id:accepted.requestId,trangThai:accepted.trangThai,banNhap:[]});aiPoll=setTimeout(()=>aiWatch(accepted.requestId),900);}
      catch(error){const target=document.getElementById('output');if(error.status===429){const hours=error.retryAfter?Math.ceil(error.retryAfter/3600):null;target.innerHTML=notice(e(error.message)+(hours?' Dùng lại sau khoảng '+hours+' giờ.':'')+' Học SRS và bài cố định không bị khóa.','warning');}else target.innerHTML=notice(e(error.message),'danger');message(error.message);}
      finally{button.disabled=false;button.removeAttribute('aria-busy');}
    }
    if(form.id==='sentence-form'){await aiRun('/ai/sentence-feedback',{tu:fd.get('tu'),cau:fd.get('cau')},form,document.getElementById('output'),sentenceView);return;}
    if(form.id==='history-filter'){historyPage=0;history();}
    if(form.id==='mastery-filter')mastery();
    if(form.id==='job-filter')jobs();
    if(form.id==='quota-form'){const rows=(data.quotaRows||[]).map(x=>({goiMa:x.goiMa,loai:x.loai,soLuotNgay:Number(fd.get(`q-${x.goiMa}-${x.loai}`)),version:x.version,truoc:x.soLuotNgay})).filter(x=>x.soLuotNgay!==x.truoc);if(!rows.length){message('Chưa có hạn mức nào thay đổi.');return;}if(!await VL.confirm({title:'Lưu hạn mức?',message:rows.map(x=>`${x.goiMa} · ${x.loai}: ${x.truoc} → ${x.soLuotNgay}`).join('; ')+'. Áp dụng ngay cho lượt kế tiếp.',confirmText:'Lưu hạn mức'}))return;try{await VL.api('PUT','/admin/service-quotas',{hanMuc:rows.map(({truoc,...x})=>x),lyDo:fd.get('quota-reason')});form.querySelector('#quota-reason').value='';await services();message('Đã lưu hạn mức.');}catch(err){if(err.status===409){await services();message(err.message);}else{VL.showErrors(form,{...err,fieldErrors:(err.fieldErrors||[]).map(f=>f.field==='lyDo'?{...f,field:'quota-reason'}:f)});message(err.message);}}return;}
    if(form.id==='announcement-form')dialog('Xem trước thông báo',`<h3>${e(fd.get('announcement-title'))}</h3><p>${e(fd.get('announcement-body'))}</p><p class="small muted">Người nhận: ${fd.get('audience')==='all'?'Tất cả người học':'Người học đang hoạt động'}. Không gửi thông báo thật.</p>${confirmActions('Gửi mô phỏng')}`,(_,d)=>{data.announcements.unshift({title:fd.get('announcement-title'),body:fd.get('announcement-body')});data.notifications.unshift({id:Date.now(),title:fd.get('announcement-title'),text:fd.get('announcement-body'),read:false,href:'thong-bao.html'});save();announcements();message('Đã gửi mô phỏng; không có email/thông báo thật.');d.close();});
  });


  root.addEventListener('input',event=>{if(event.target.closest('.d3-draft-fields')&&page==='ai-xuong-the')aiCommitKey=null;});
  root.addEventListener('change',event=>{
    if(event.target.id==='passage-file'){const file=event.target.files[0];if(file){if(file.size>1024*1024){message('Tệp tối đa 1 MB.');event.target.value='';}else file.text().then(text=>{document.getElementById('passage').value=text.slice(0,5000);message(text.length>5000?'Đã đọc 5.000 ký tự đầu của tệp.':'Đã đọc nội dung tệp vào ô đoạn văn.');});}}
    if(event.target.name==='commit-target'){const isNew=event.target.value==='new';document.getElementById('commit-deck').disabled=isNew;document.getElementById('commit-name').disabled=!isNew;(isNew?document.getElementById('commit-name'):document.getElementById('commit-deck')).focus();}

    if(event.target.name==='draft')aiCount();
    if(event.target.id==='record-filter'){records();document.getElementById('compare').disabled=true;}
    if(event.target.name==='compare-record'){const selected=[...root.querySelectorAll('[name="compare-record"]:checked')];if(selected.length>2){event.target.checked=false;message('Chọn tối đa 2 lượt để so sánh.');}document.getElementById('compare').disabled=root.querySelectorAll('[name="compare-record"]:checked').length!==2;}
    if(event.target.id==='week')weekly();
    if(event.target.id==='report-state')reports();
    if(event.target.id==='pron-word'){clearRecording();document.getElementById('pron-title').textContent=event.target.value;document.getElementById('pron-ipa').textContent={receipt:'/rɪˈsiːt/',schedule:'/ˈskedʒ.uːl/',appointment:'/əˈpɔɪnt.mənt/'}[event.target.value]||'Chưa có phiên âm';document.getElementById('record-start').disabled=false;document.getElementById('record-audio').hidden=true;document.getElementById('assess').disabled=true;document.getElementById('record-status').textContent='Chưa ghi âm · tối đa 15 giây';}
  });
  root.addEventListener('click',async event=>{
    const opened=event.target.closest('[data-notification-open]');if(opened){event.preventDefault();VL.api('PATCH','/notifications/'+encodeURIComponent(opened.dataset.notificationOpen),{daDoc:true}).finally(()=>{location.href=opened.href;});return;}
    const notify=event.target.closest('[data-notify-filter]');if(notify){notificationFilter=notify.dataset.notifyFilter;notifications();return;}
    const motivation=event.target.closest('[data-motivation]');if(motivation){motivationKind=motivation.dataset.motivation;motivations();return;}
    const pager=event.target.closest('[data-page]');if(pager&&page==='ai-lich-su'){historyPage=Number(pager.dataset.page);history();return;}
    const button=event.target.closest('[data-action]');if(!button)return;const action=button.dataset.action,id=Number(button.dataset.id);
    if(action==='cancel-task'){if(page==='ai-xuong-the'&&aiPoll){clearTimeout(aiPoll);aiPoll=null;document.getElementById('output').innerHTML=notice('Đã dừng theo dõi. Yêu cầu vẫn tiếp tục trên máy chủ; xem kết quả trong Lịch sử AI.');message('Đã dừng theo dõi');return;}aiTaskSeq++;return;}
    if(action==='retry'){stateSelect.value='ready';render();return;}
    if(action==='speak')VL.speak(button.dataset.word||button.closest('[data-draft]')?.querySelector('.d3-draft-fields input')?.value);
    if(action==='edit-draft'){const card=button.closest('[data-draft]'),editing=card.querySelector('input[readonly]');if(editing){card.querySelectorAll('input[readonly],textarea[readonly]').forEach(x=>x.removeAttribute('readonly'));button.innerHTML=icon('check')+'Xong';card.querySelector('.d3-draft-fields input').focus();}else{const inputs=[...card.querySelectorAll('.d3-draft-fields input,.d3-draft-fields textarea')];if(inputs.some(x=>!x.reportValidity()))return;inputs.forEach(x=>x.setAttribute('readonly',''));button.innerHTML=icon('edit')+'Sửa bản nháp';}}
    if(action==='source')dialog('Đoạn nguồn',`<p class="d3-source en">${e(samples[id].sentence)}</p><p>Từ gợi ý: <strong>${e(samples[id].word)}</strong>. Kiểm tra nghĩa trong đoạn văn gốc.</p>`);
    if(action==='edit-ai'){const box=document.getElementById('edit-'+button.dataset.draftId),open=box.hidden;box.hidden=!open;button.setAttribute('aria-expanded',String(open));button.innerHTML=icon(open?'check':'edit')+(open?'Xong':'Sửa trước khi lưu');if(open)box.querySelector('input').focus();return;}
    if(action==='commit'){
      const ids=[...root.querySelectorAll('[name="draft"]:checked')].map(x=>x.value);if(!ids.length)return;
      const isNew=root.querySelector('[name="commit-target"]:checked')?.value==='new',deck=document.getElementById('commit-deck'),name=document.getElementById('commit-name');
      if(isNew&&!name.value.trim()){name.setCustomValidity('Nhập tên bộ mới');name.reportValidity();name.setCustomValidity('');return;}
      if(!isNew&&!deck.value){deck.setCustomValidity('Chọn bộ thẻ nhận thẻ');deck.reportValidity();deck.setCustomValidity('');return;}
      const requestId=aiCurrent;if(!requestId)return;
      const val=(id,k)=>(document.getElementById(k+'-'+id)?.value||'').trim();
      const sua=ids.filter(id=>{const x=aiLast?.banNhap.find(d=>d.id===id);return x&&(val(id,'tu')!==x.tu||val(id,'loai')!==(x.tuLoai||'')||val(id,'nghia')!==x.nghiaVi||val(id,'vidu')!==(x.viDuEn||'')||val(id,'dich')!==(x.dichVi||''));}).map(id=>({banNhapId:id,tu:val(id,'tu'),tuLoai:val(id,'loai')||null,nghiaVi:val(id,'nghia'),viDuEn:val(id,'vidu')||null,dichVi:val(id,'dich')||null}));
      const invalid=sua.find(x=>!x.tu||!x.nghiaVi);if(invalid){const box=document.getElementById('edit-'+invalid.banNhapId);box.hidden=false;box.querySelector(invalid.tu?'textarea':'input').reportValidity();return;}
      aiCommitKey=aiCommitKey||('ui29-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8));
      button.disabled=true;button.setAttribute('aria-busy','true');
      try{
        const result=await VL.api('POST','/ai/card-drafts/'+encodeURIComponent(requestId)+'/commit',Object.assign(isNew?{banNhapIds:ids,tenBoMoi:name.value.trim()}:{banNhapIds:ids,boTheId:deck.value},sua.length?{sua}:{}),{headers:{'Idempotency-Key':aiCommitKey}});
        aiCommitKey=null;data.committed+=result.soTheDaLuu;const item=data.requests.find(x=>x.aiId===requestId);if(item)item.detail='Đã lưu '+result.soTheDaLuu+' thẻ';save();
        const dup=result.ketQua.filter(x=>x.trung).length;
        const fresh=await VL.api('GET','/ai/requests/'+encodeURIComponent(requestId));document.getElementById('output').innerHTML=notice('Đã lưu '+result.soTheDaLuu+' thẻ vào '+(result.boMoi?'bộ mới':'bộ đã chọn')+'.'+(dup?' '+dup+' thẻ trùng từ đã có trong bộ (không ghi đè thẻ cũ).':''),'success')+`<div class="d3-actions">${link('Xem bộ thẻ','../dot1/bo-the-chi-tiet.html?id='+encodeURIComponent(result.boTheId),'primary')}${link('Học bộ này','../dot2/hoc.html?boTheId='+encodeURIComponent(result.boTheId),'accent')}</div>`+aiDraftList(fresh);aiCount();message('Đã lưu '+result.soTheDaLuu+' thẻ đã chọn.');
      }catch(error){message(error.message+(error.status===409?'':' Bấm lưu lại sẽ dùng cùng Idempotency-Key, không tạo trùng.'));button.disabled=false;}
      finally{button.removeAttribute('aria-busy');}
    }
    if(action==='context-open'){const c=contextCard();const d=dialog('Giải thích theo ngữ cảnh',`${field('Từ cần hiểu','tu',c.word,'text','required maxlength="100" autocomplete="off"')}${textarea('Câu hoặc đoạn chứa từ','nguCanh',c.exampleEn||'','maxlength="1000"')}<div class="d3-actions"><button type="submit" class="btn btn-primary">Giải thích bằng AI</button></div><div id="context-result" class="d3-stack" tabindex="-1" aria-live="polite"><p class="small muted">AI có thể sai. Mỗi lần gửi dùng 1 lượt AI.</p></div>`,(fd,dd)=>aiRun('/ai/context-explanations',{tu:fd.get('tu'),nguCanh:fd.get('nguCanh')||null},dd.querySelector('form'),dd.querySelector('#context-result'),contextView),true);d.addEventListener('close',()=>{aiTaskSeq++;},{once:true});}
    if(action==='ai-detail'){try{const r=await VL.api('GET','/ai/requests/'+encodeURIComponent(button.dataset.aiId));const k=r.ketQua;const body=r.trangThai!=='HOAN_TAT'?notice(r.trangThai==='LOI'?(AI_ERROR[r.maLoi]||'Lỗi '+(r.maLoi||''))+' Đã hoàn lượt.':r.trangThai==='KHONG_XAC_DINH'?'Chưa xác định kết quả ('+(r.maLoi||'')+'). Lượt đã được tính.':'Đang xử lý.',r.trangThai==='LOI'?'danger':'warning'):!k?notice('Kết quả đã bị ẩn sau kiểm duyệt.','warning'):r.loai==='SUA_CAU'?sentenceView(k):r.loai==='NGU_CANH'?contextView(k):r.loai==='TAO_THE'?`<p>${k.soThe} thẻ nháp · ${k.soTrung} trùng · ${k.soBoQua} bỏ qua.</p>`+link('Mở xưởng thẻ','ai-xuong-the.html'):`<p>Tệp ảnh ${e(k.tepId||'')}</p>`;dialog(AI_LOAI[r.loai]||r.loai,`<dl class="kv"><dt>Trạng thái</dt><dd>${aiStamp(r.trangThai)}</dd><dt>Tạo lúc</dt><dd>${e(VL.fmtDateTime(r.createdAt))}</dd><dt>Nhà cung cấp</dt><dd>${e(r.nhaCungCap)}${r.moPhong?' · mô phỏng':''}</dd><dt>Phiên bản prompt</dt><dd>${e(r.phienBanPrompt||'—')}</dd></dl>${body}${AI_LINK[r.loai]?link('Tạo yêu cầu mới',AI_LINK[r.loai],'quiet'):''}`);}catch(err){message(err.message);}}
    if(action==='evidence')dialog('Bằng chứng gợi ý',`<h3>${e(button.dataset.word)}</h3><ul class="d3-evidence">${button.dataset.word.includes("/")?"<li>10/10 · Điền từ · nhầm complimentary với complementary</li><li>12/10 · Chọn nghĩa · nhầm complementary với complimentary</li>":"<li>10/10 · Anh → Việt · Quên</li><li>10/10 · Anh → Việt · Nhớ</li><li>11/10 · Anh → Việt · Quên</li><li>11/10 · Anh → Việt · Nhớ</li><li>12/10 · Anh → Việt · Quên</li>"}</ul><p class="small muted">Ví dụ các lượt liên quan gần đây. Số liệu và đường dẫn sự kiện thật cần backend cung cấp.</p>${link('Xem tiến độ mẫu','../dot2/bo-the-tien-do.html?id=21')}`);
    if(action==='history-detail'||action==='job-detail')dialog(button.dataset.title,`<dl class="kv"><dt>Trạng thái mẫu</dt><dd>${e(button.dataset.state)}</dd><dt>Kết quả</dt><dd>${e(button.dataset.detail||'Xem trạng thái tác vụ mẫu')}</dd><dt>Mã đối soát</dt><dd>DOT3-DEMO</dd><dt>Chi phí</dt><dd>Chưa xác định</dd></dl>${action==='history-detail'?link('Tiếp tục tại công cụ',button.dataset.title.includes('Viết câu')?'ai-viet-cau.html':button.dataset.title.includes('ngữ cảnh')?'ai-giai-thich.html':'ai-xuong-the.html','primary'):''}<p class="small muted">Không hiển thị khóa dịch vụ, prompt nội bộ hoặc dữ liệu nhạy cảm.</p>`);
    if(action==='record')await record();
    if(action==='stop-record'&&recorder?.state==='recording')recorder.stop();
    if(action==='reset-record'){clearRecording();document.getElementById('record-start').disabled=false;document.getElementById('record-reset').disabled=true;document.getElementById('record-stop').disabled=true;document.getElementById('assess').disabled=true;document.getElementById('record-audio').hidden=true;document.getElementById('record-status').textContent='Chưa ghi âm · tối đa 15 giây';}
    if(action==='pron-speak')VL.speak(document.getElementById('pron-word').value);
    if(action==='sample-assessment')assessment({mimeType:'audio/wav',size:32044,durationMs:1000});
    if(action==='assess'&&recordBlob){button.disabled=true;try{const wav=await toWav(recordBlob);await assessment({mimeType:'audio/wav',size:wav.blob.size,durationMs:wav.durationMs,url:URL.createObjectURL(wav.blob)});}catch(error){message('Không đổi được bản ghi sang WAV, hãy ghi lại.');}finally{button.disabled=false;}}
    if(action==='delete-record'&&await VL.confirm({title:'Xóa bản ghi âm?',message:'Tệp ghi âm bị xóa khỏi máy chủ; điểm của lượt này vẫn giữ.',danger:true,confirmText:'Xóa bản ghi'})){try{await VL.api('DELETE','/pronunciation/recordings/'+encodeURIComponent(button.dataset.id));await records();document.getElementById('comparison').innerHTML='';document.getElementById('compare').disabled=true;message('Đã xóa bản ghi âm, điểm vẫn giữ.');}catch(error){message(error.message);}}
    if(action==='compare'){const list=[...root.querySelectorAll('[name="compare-record"]:checked')].map(x=>historyItems.find(r=>r.id===x.value));if(list.some(x=>!x)||list[0].theId!==list[1].theId){message('Chọn hai lượt của cùng một từ để so sánh.');return;}const same=list[0].nhaCungCap===list[1].nhaCungCap&&list[0].moPhong===list[1].moPhong;const d=(k)=>!same||list[0][k]===null||list[1][k]===null?'—':diff(Math.round((list[0][k]-list[1][k])*10)/10);document.getElementById('comparison').innerHTML='<h2>So sánh <span lang="en">'+e(list[0].vanBanMau)+'</span></h2>'+table(['Chỉ số','Lượt mới','Lượt cũ','Chênh lệch'],[['Tổng điểm','tongDiem'],['Độ chính xác','doChinhXac'],['Độ trôi chảy','doTroiChay'],['Độ đầy đủ','doDayDu']].map(([n,k])=>[n,score(list[0][k]),score(list[1][k]),d(k)]),'Giá trị thiếu không quy thành 0 và không tính chênh lệch');message('Đang so sánh 2 lượt.');}
    if(action==='notify-read'){VL.api('PATCH','/notifications/'+encodeURIComponent(button.dataset.id),{daDoc:true}).then(()=>{notifications();message('Đã đánh dấu đọc.');});}
    if(action==='deletion-open')dialog('Bước 1/2 · Phạm vi xóa',`<ul class="d3-evidence">${DELETION_POLICY.map(([a,c])=>`<li><strong>${e(a)}:</strong> ${e(c)}</li>`).join('')}</ul><label class="choice"><input type="checkbox" name="ack" required><span class="bubble" aria-hidden="true"></span><span>Tôi hiểu dữ liệu sẽ bị xóa và không thể hoàn tác</span></label>${confirmActions('Tiếp tục')}`,(_,d)=>{d.close();dialog('Bước 2/2 · Xác nhận xóa tài khoản',`<p>Nhập email và mật khẩu của tài khoản để xác nhận. Tài khoản chỉ đăng nhập bằng Google để trống mật khẩu.</p>${field('Email tài khoản','xacNhan','','email','required maxlength="255" autocomplete="off"')}${field('Mật khẩu','matKhau','','password','maxlength="100" autocomplete="current-password"')}<div id="deletion-error" aria-live="polite"></div>${confirmActions('Xóa tài khoản','danger-solid')}`,async(fd,d2)=>{const form=d2.querySelector('form'),submit=d2.querySelector('[type="submit"]');VL.clearErrors(form);d2.querySelector('#deletion-error').innerHTML='';submit.disabled=true;try{const r=await VL.api('POST','/me/deletion-requests',{xacNhan:fd.get('xacNhan'),matKhau:fd.get('matKhau')||null});d2.close();deletionDone(r);message('Đã nhận yêu cầu xóa tài khoản.');}catch(err){if(err.fieldErrors&&err.fieldErrors.length)VL.showErrors(form,err);else d2.querySelector('#deletion-error').innerHTML=notice(e(err.message)+(err.requestId?' · Mã '+e(err.requestId):''),'danger');submit.disabled=false;}});});
    if(action==='deletion-restore'){VLDemo.reset();location.href='../dot1/dang-nhap.html';}
    if(action==='report-open'){if(!button.dataset.id){location.href='bao-cao-noi-dung.html';return;}dialog('Báo cáo nội dung',`<p><strong>${e(REPORT_KIND[button.dataset.kind])}:</strong> ${e(button.dataset.target)}</p>${select('Lý do','reason',Object.entries(REPORT_REASON))}${textarea('Mô tả vấn đề','report-description','','required minlength="10" maxlength="500"')}<p class="small muted">Không gửi thông tin cá nhân hoặc mật khẩu.</p><div id="report-error" aria-live="polite"></div>${confirmActions('Gửi báo cáo')}`,async(fd,d)=>{const submit=d.querySelector('[type="submit"]');submit.disabled=true;try{await VL.api('POST','/reports',{loaiDoiTuong:button.dataset.kind,doiTuongId:button.dataset.id,lyDo:fd.get('reason'),moTa:fd.get('report-description')});d.close();message('Đã tiếp nhận báo cáo. Quản trị viên sẽ kiểm tra nội dung.');}catch(err){d.querySelector('#report-error').innerHTML=notice(e(err.message),err.status===409?'warning':'danger');submit.disabled=false;}});}
    if(action==='report-review'){const report=reportList.find(x=>x.id===button.dataset.id);if(!report)return;const shown=Object.entries(report.noiDung).filter(([k,v])=>v!==null&&typeof v!=='object'&&!['ten','chuSoHuuId','boTheId'].includes(k));const pending=report.trangThai==='CHO_XU_LY';dialog('Báo cáo #'+report.id,`<h3>${e(report.noiDung.ten)}</h3><p class="small muted">${e(REPORT_KIND[report.loaiDoiTuong])} · bản chụp lúc báo cáo · ${e(new Date(report.createdAt).toLocaleString('vi-VN'))}</p>${shown.length?`<dl class="kv">${shown.map(([k,v])=>`<dt>${e(SNAPSHOT_LABEL[k]||k)}</dt><dd>${e(v)}</dd>`).join('')}</dl>`:''}<p><strong>${e(REPORT_REASON[report.lyDo])}</strong> — ${e(report.moTa)}</p><p class="small muted">Người báo cáo: ${e(report.nguoiBaoCao.tenHienThi||'—')}</p>${pending?`${select('Quyết định','decision',[['GIU','Giữ nội dung'],['AN','Ẩn nội dung']])}${textarea('Lý do quyết định','resolve-reason','','required minlength="10" maxlength="500"')}<p class="small muted">Quyết định áp cho mọi báo cáo đang chờ của cùng nội dung và được ghi vào nhật ký thao tác.</p><div id="resolve-error" aria-live="polite"></div>${confirmActions('Lưu quyết định')}`:`<p>${stamp(...REPORT_STATE[report.trangThai])} ${e(report.lyDoXuLy)}</p><p class="small muted">${e(report.nguoiXuLy?.tenHienThi||'')} · ${e(new Date(report.xuLyAt).toLocaleString('vi-VN'))}</p>`}`,pending?async(fd,d)=>{const submit=d.querySelector('[type="submit"]');submit.disabled=true;try{await VL.api('POST','/admin/reports/'+report.id+'/resolve',{quyetDinh:fd.get('decision'),lyDo:fd.get('resolve-reason')});d.close();await reports();message(fd.get('decision')==='AN'?'Đã ẩn nội dung và ghi lý do.':'Đã giữ nội dung và ghi lý do.');}catch(err){d.querySelector('#resolve-error').innerHTML=notice(e(err.message),'danger');submit.disabled=false;}}:null);}
    if(action==='motivation-new'||action==='motivation-edit'){const item=data[motivationKind].find(x=>x.id===id);dialog(item?'Sửa danh mục mẫu':'Tạo danh mục mẫu',`${field('Tên','motivation-name',item?.name||'','text','required maxlength="100"')}${textarea('Điều kiện đạt','motivation-rule',item?.rule||'','required minlength="10" maxlength="500"')}${confirmActions('Lưu mẫu')}`,(fd,d)=>{if(item){item.name=fd.get('motivation-name');item.rule=fd.get('motivation-rule');}else data[motivationKind].push({id:Date.now(),name:fd.get('motivation-name'),rule:fd.get('motivation-rule'),active:true});save();motivations();message('Đã lưu danh mục mẫu.');d.close();});}
    if(action==='motivation-toggle'){const item=data[motivationKind].find(x=>x.id===id);if(await VL.confirm({title:(item.active?'Tắt':'Bật')+' mục mẫu?',message:item.name+'. Không thay đổi phần thưởng đã ghi nhận.',confirmText:'Xác nhận'})){item.active=!item.active;save();motivations();}}
  });
  stateSelect.addEventListener('change',()=>{clearRecording();render();});
  window.addEventListener('pagehide',()=>{disposed=true;aiTaskSeq++;clearRecording();});
  window.addEventListener('pageshow',event=>{disposed=false;if(event.persisted){data=VLFlow.read();render();}});
  document.getElementById('d3-reset').onclick=()=>{clearRecording();VLFlow.reset();data=VLFlow.read();stateSelect.value='ready';render();message('Đã đặt lại riêng dữ liệu đợt 3.');};
  render();
})();
