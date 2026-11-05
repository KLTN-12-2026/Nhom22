(function () {
  'use strict';
  if(window.VocabMascot)return;
  const script=document.currentScript?.src||new URL('/mascot.js',location.origin).href;
  const mock=new URL(script).pathname.includes('/shared/');
  const route=(file,fe)=>mock?new URL('../'+file,script).href:fe;
  let host,resetTimer,lastTransient=0,speaking=false,pending=false,collapsed=false,activeRequests=0;
  let name='Mực';
  try{const stored=localStorage.getItem('vocab:mascot:name');if(stored?.trim())name=stored.trim().slice(0,24);}catch{}
  const line=state=>copy[state].replaceAll('Mực',()=>name);
  const copy={idle:'Một chút mỗi ngày, cùng Mực nhé.',wave:'Mực đây! Hôm nay mình học gì?',thinking:'Mực chờ cùng bạn…',success:'Xong rồi! Bạn tiến thêm một bước.',error:'Không sao, mình xem lại nhé.',speaking:'Mực đang nghe cùng bạn.'};
  function apply(state){if(!host||host.dataset.mucState===state)return;host.dataset.mucState=state;host.querySelector('.muc-bubble').textContent=line(state);}
  function settle(){if(Date.now()<lastTransient)return;apply(speaking?'speaking':pending?'thinking':'idle');}
  function react(state){if(!copy[state])return;clearTimeout(resetTimer);lastTransient=Date.now()+2400;apply(state);resetTimer=setTimeout(settle,2450);}
  window.VocabMascot={react};
  window.addEventListener('vocab:mascot',event=>{const state=event.detail?.state;if(state==='start'||state==='end'){activeRequests=Math.max(0,activeRequests+(state==='start'?1:-1));pending=activeRequests>0||!!document.querySelector('[aria-busy="true"]');settle();return;}if(state==='speaking'||state==='quiet'){speaking=state==='speaking';settle();}else react(state);});
  async function mount(){
    if(host)return;
    let svg;try{const response=await fetch(new URL('mascot.svg',script));if(!response.ok)return;svg=await response.text();}catch{return;}
    host=document.createElement('aside');host.className='muc-companion';host.dataset.mucState='idle';host.setAttribute('aria-label','Mực, bạn học từ vựng');
    try{collapsed=localStorage.getItem('vocab:mascot:collapsed')==='true';}catch{}
    host.dataset.collapsed=String(collapsed);
    host.innerHTML=`<div class="muc-panel" id="muc-panel" hidden><div class="muc-panel-head"><h2>Mực · bạn học của bạn</h2><button class="btn btn-quiet btn-icon" type="button" data-muc-close aria-label="Đóng bảng Mực">×</button></div><p class="small">Hôm nay bạn muốn làm gì?</p><form data-muc-name-form><label class="field-label" for="muc-name">Tên bạn học</label><input class="input" id="muc-name" maxlength="24" required autocomplete="off"><button class="btn btn-edit btn-sm" type="submit">Lưu tên</button><p class="field-hint" data-muc-name-status role="status"></p></form><a class="btn btn-accent" href="${route('dot2/hoc.html','/hoc')}">Ôn một phiên ngắn</a><a class="btn btn-secondary" href="${route('dot2/so-tay.html','/so-tay')}">Xem những từ cần luyện</a><button class="btn btn-media" type="button" data-muc-wave>Đập tay với Mực</button><button class="muc-hide" type="button" data-muc-hide>Thu gọn Mực</button></div><div class="muc-bubble" aria-hidden="true">${copy.idle}</div><button class="muc-toggle" type="button" aria-label="Tương tác với Mực" aria-expanded="false" aria-controls="muc-panel">${svg}</button>`;
    document.body.appendChild(host);
    const toggle=host.querySelector('.muc-toggle'),panel=host.querySelector('.muc-panel');
    const nameInput=host.querySelector('#muc-name');
    function updateName(){
      host.setAttribute('aria-label',name+', bạn học từ vựng');
      host.querySelector('h2').textContent=name+' · bạn học của bạn';
      host.querySelector('[data-muc-close]').setAttribute('aria-label','Đóng bảng '+name);
      toggle.setAttribute('aria-label','Tương tác với '+name);
      host.querySelector('[data-muc-wave]').textContent='Đập tay với '+name;
      host.querySelector('[data-muc-hide]').textContent='Thu gọn '+name;
      host.querySelector('.muc-bubble').textContent=line(host.dataset.mucState);
      nameInput.value=name;
    }
    updateName();
    host.querySelector('[data-muc-name-form]').onsubmit=event=>{
      event.preventDefault();const value=nameInput.value.trim().replace(/\s+/g,' ');
      const message=host.querySelector('[data-muc-name-status]');
      if(!value){message.textContent='Nhập tên từ 1 đến 24 ký tự.';nameInput.focus();return;}
      try{localStorage.setItem('vocab:mascot:name',value.slice(0,24));name=value.slice(0,24);updateName();message.textContent='Đã lưu tên trên trình duyệt này.';react('success');}
      catch{message.textContent='Trình duyệt đang chặn lưu tên.';}
    };
    window.addEventListener('storage',event=>{if(event.key==='vocab:mascot:name'){name=event.newValue?.trim().slice(0,24)||'Mực';updateName();}});
    let position=null,drag=null,suppressClick=false;
    const positionKey='vocab:mascot:position';
    try{const saved=JSON.parse(localStorage.getItem(positionKey));if(Number.isFinite(saved?.x)&&Number.isFinite(saved?.y))position=saved;}catch{}
    function place(x,y){
      const width=toggle.offsetWidth,height=toggle.offsetHeight;
      const maxX=Math.max(8,window.innerWidth-width-8),maxY=Math.max(8,window.innerHeight-height-8);
      x=Math.max(8,Math.min(maxX,x));y=Math.max(8,Math.min(maxY,y));
      host.dataset.positioned='true';host.dataset.edge=x<window.innerWidth/2?'left':'right';
      host.style.left=x+'px';host.style.top=y+'px';
      const below=window.innerHeight-y-height-16,above=y-16;
      host.dataset.panelSide=below>above?'below':'above';
      panel.style.maxHeight=Math.max(44,Math.max(below,above))+'px';
      const panelWidth=Math.min(304,window.innerWidth-32),bubbleWidth=host.querySelector('.muc-bubble').offsetWidth||Math.min(240,window.innerWidth-32);
      for(const [element,size] of [[panel,panelWidth],[host.querySelector('.muc-bubble'),bubbleWidth]]){
        const ideal=x<window.innerWidth/2?x:x+width-size;
        element.style.left=(Math.max(16,Math.min(window.innerWidth-size-16,ideal))-x)+'px';element.style.right='auto';
      }
      position={x:(x-8)/Math.max(1,maxX-8),y:(y-8)/Math.max(1,maxY-8)};
    }
    function restore(){if(position)place(8+position.x*Math.max(0,window.innerWidth-toggle.offsetWidth-16),8+position.y*Math.max(0,window.innerHeight-toggle.offsetHeight-16));}
    function savePosition(){try{localStorage.setItem(positionKey,JSON.stringify(position));}catch{}}
    restore();window.addEventListener('resize',restore);
    toggle.title='Kéo để di chuyển · Alt + phím mũi tên để chỉnh vị trí';
    toggle.addEventListener('pointerdown',event=>{
      if(event.button!==0||!event.isPrimary)return;
      suppressClick=false;const rect=toggle.getBoundingClientRect();
      drag={id:event.pointerId,startX:event.clientX,startY:event.clientY,x:rect.left,y:rect.top,moved:false};
      toggle.setPointerCapture(event.pointerId);
    });
    toggle.addEventListener('pointermove',event=>{
      if(!drag||event.pointerId!==drag.id)return;
      const dx=event.clientX-drag.startX,dy=event.clientY-drag.startY;
      if(!drag.moved&&Math.hypot(dx,dy)<6)return;
      drag.moved=true;panel.hidden=true;toggle.setAttribute('aria-expanded','false');host.dataset.dragging='true';
      place(drag.x+dx,drag.y+dy);
    });
    function endDrag(event){
      if(!drag||event.pointerId!==drag.id)return;
      if(drag.moved){savePosition();suppressClick=true;}
      drag=null;delete host.dataset.dragging;
      if(toggle.hasPointerCapture(event.pointerId))toggle.releasePointerCapture(event.pointerId);
    }
    toggle.addEventListener('pointerup',endDrag);
    toggle.addEventListener('pointercancel',endDrag);
    toggle.addEventListener('lostpointercapture',endDrag);
    toggle.addEventListener('keydown',event=>{
      if(!event.altKey||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
      event.preventDefault();const rect=toggle.getBoundingClientRect();
      place(rect.left+(event.key==='ArrowLeft'?-16:event.key==='ArrowRight'?16:0),rect.top+(event.key==='ArrowUp'?-16:event.key==='ArrowDown'?16:0));savePosition();
    });
    const reset=document.createElement('button');reset.type='button';reset.className='muc-hide';reset.textContent='Đưa về góc mặc định';
    reset.onclick=()=>{position=null;delete host.dataset.positioned;delete host.dataset.edge;delete host.dataset.panelSide;host.style.removeProperty('left');host.style.removeProperty('top');panel.style.removeProperty('max-height');for(const el of [panel,host.querySelector('.muc-bubble')]){el.style.removeProperty('left');el.style.removeProperty('right');}try{localStorage.removeItem(positionKey);}catch{}close();};
    panel.appendChild(reset);
    function close(){panel.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.focus();}
    toggle.onclick=event=>{if(suppressClick&&event.detail!==0){suppressClick=false;return;}if(collapsed){collapsed=false;host.dataset.collapsed='false';try{localStorage.setItem('vocab:mascot:collapsed','false');}catch{}}restore();panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden));react('wave');};
    host.querySelector('[data-muc-close]').onclick=close;
    host.querySelector('[data-muc-wave]').onclick=()=>react('success');
    host.querySelector('[data-muc-hide]').onclick=()=>{collapsed=true;host.dataset.collapsed='true';try{localStorage.setItem('vocab:mascot:collapsed','true');}catch{}close();};
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden)close();});
    document.addEventListener('click',event=>{if(!panel.hidden&&!host.contains(event.target)){panel.hidden=true;toggle.setAttribute('aria-expanded','false');}});
    host.addEventListener('pointermove',event=>{if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;const r=toggle.getBoundingClientRect();host.style.setProperty('--muc-look-x',Math.max(-3,Math.min(3,(event.clientX-r.x-r.width/2)/12))+'px');host.style.setProperty('--muc-look-y',Math.max(-2,Math.min(2,(event.clientY-r.y-r.height/2)/18))+'px');});
    host.addEventListener('pointerleave',()=>{host.style.setProperty('--muc-look-x','0px');host.style.setProperty('--muc-look-y','0px');});
    function update(){pending=activeRequests>0||!!document.querySelector('[aria-busy="true"]:not(.muc-companion *)');host.hidden=!!document.querySelector('dialog[open]');settle();}
    new MutationObserver(update).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['aria-busy','open']});
    document.addEventListener('visibilitychange',()=>{host.querySelectorAll('svg *').forEach(el=>{el.style.animationPlayState=document.hidden?'paused':'running';});});
    update();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
