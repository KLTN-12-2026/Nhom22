/* Luồng xử lý hỗ trợ mẫu, không gọi backend hoặc gửi email. */
(() => {
  'use strict';
  if (!window.VL?.ready || !VL.me()?.vaiTro.includes('ADMIN')) return;
  const $ = id => document.getElementById(id);
  const esc = VL.esc;
  const CATEGORY = { technical:'Kỹ thuật', academic:'Học vụ', payment:'Thanh toán', other:'Khác' };
  const PRIORITY = { low:'Thấp', medium:'Trung bình', high:'Cao', critical:'Nghiêm trọng' };
  const STATUS = { open:'Đang mở', resolved:'Đã giải quyết' };
  const SORT = { newest:'Mới nhất trước', oldest:'Cũ nhất trước', priority:'Ưu tiên cao trước' };
  const RANK = { critical:0, high:1, medium:2, low:3 };
  const SIZE = 6;
  const tabs = [...document.querySelectorAll('[data-status]')];
  const normalize = text => String(text).toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  const date = value => new Intl.DateTimeFormat('vi-VN', { timeZone:'Asia/Ho_Chi_Minh', day:'2-digit', month:'2-digit', year:'numeric' }).format(new Date(value));
  const dateTime = value => new Intl.DateTimeFormat('vi-VN', { timeZone:'Asia/Ho_Chi_Minh', day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit', hour12:false }).format(new Date(value));
  let state = { search:'', category:'', priority:'', status:'', sort:'newest', page:0 };
  let tickets = [], selected = null, saving = false, trigger = null, timer;
  document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = VL.icon(el.dataset.icon); });

  function readAll() {
    const users = VLDemo.db.users;
    tickets = users.flatMap(user => {
      try {
        // Nguyễn An provides the initial sample; other users appear after creating a ticket.
        if (user.id !== '2' && localStorage.getItem(SupportDemo.PREFIX + user.id) === null) return [];
      } catch { if (user.id !== '2') return []; }
      return SupportDemo.read(user.id).map(ticket => ({ ...ticket, user, key:user.id + ':' + ticket.id }));
    });
  }
  function fromURL() {
    const status = new URLSearchParams(location.search).get('status');
    state.status = Object.hasOwn(STATUS, status) ? status : '';
  }
  function updateURL() {
    const url = new URL(location.href);
    if (state.status) url.searchParams.set('status', state.status); else url.searchParams.delete('status');
    if (url.href !== location.href) history.pushState({}, '', url);
  }
  function filtered(withStatus = true) {
    const query = normalize(state.search);
    return tickets.filter(t => (!query || normalize([t.id, t.title, t.description, t.user.tenHienThi, t.user.email].join(' ')).includes(query)) && (!state.category || t.category === state.category) && (!state.priority || t.priority === state.priority) && (!withStatus || !state.status || t.status === state.status)).sort((a,b) => (state.sort === 'priority' ? RANK[a.priority] - RANK[b.priority] : 0) || (state.sort === 'oldest' ? Date.parse(a.createdAt) - Date.parse(b.createdAt) : Date.parse(b.createdAt) - Date.parse(a.createdAt)) || a.key.localeCompare(b.key));
  }
  const badge = (type, value, label) => `<span class="support-badge" data-${type}="${esc(value)}">${esc(label)}</span>`;
  function render() {
    const matches = filtered(), counts = filtered(false), pages = Math.ceil(matches.length / SIZE);
    state.page = Math.max(0, Math.min(state.page, pages - 1));
    const start = state.page * SIZE;
    $('total-count').textContent = tickets.length;
    $('open-count').textContent = tickets.filter(t => t.status === 'open').length;
    $('urgent-count').textContent = tickets.filter(t => t.status === 'open' && ['high','critical'].includes(t.priority)).length;
    $('resolved-count').textContent = tickets.filter(t => t.status === 'resolved').length;
    document.querySelector('[data-count="all"]').textContent = counts.length;
    for (const status of Object.keys(STATUS)) document.querySelector(`[data-count="${status}"]`).textContent = counts.filter(t => t.status === status).length;
    tabs.forEach(tab => {
      const active = tab.dataset.status === state.status;
      tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1;
      if (active) $('support-panel').setAttribute('aria-labelledby', tab.id);
    });
    const chips = [['search', state.search && 'Tìm: ' + state.search], ['status', STATUS[state.status]], ['category', CATEGORY[state.category]], ['priority', PRIORITY[state.priority] && 'Ưu tiên: ' + PRIORITY[state.priority]]].filter(([, label]) => label);
    $('filter-count').hidden = !chips.length; $('filter-count').textContent = chips.length;
    $('support-chips').hidden = !chips.length;
    $('support-chips').innerHTML = chips.map(([key,label]) => `<button class="support-chip" type="button" data-remove="${key}" aria-label="Gỡ bộ lọc ${esc(label)}"><span>${esc(label)}</span>${VL.icon('x')}</button>`).join('') + (chips.length ? '<button class="btn btn-quiet btn-sm" type="button" data-reset>Đặt lại</button>' : '');
    $('result-count').textContent = matches.length + ' phiếu hỗ trợ';
    $('sort-label').textContent = SORT[state.sort];
    $('support-empty').hidden = !!matches.length;
    document.querySelector('.support-table-wrap').hidden = !matches.length;
    $('ticket-list').innerHTML = matches.slice(start, start + SIZE).map(t => `<tr>
      <td><button class="support-ticket-title" type="button" data-detail="${esc(t.key)}">${esc(t.title)}</button><div class="support-ticket-meta"><span>#${esc(t.id)}</span><span>${CATEGORY[t.category]}</span><time datetime="${esc(t.createdAt)}">${date(t.createdAt)}</time></div></td>
      <td><span class="support-student">${esc(t.user.tenHienThi)}</span><span class="support-email">${esc(t.user.email)}</span></td>
      <td>${badge('priority',t.priority,PRIORITY[t.priority])}</td><td>${badge('state',t.status,STATUS[t.status])}</td>
      <td><button class="btn btn-quiet btn-icon" type="button" data-detail="${esc(t.key)}" aria-label="Xem phiếu ${esc(t.id)} của ${esc(t.user.tenHienThi)}">${VL.icon('eye')}</button></td>
    </tr>`).join('');
    $('support-pagination').hidden = !matches.length;
    $('page-summary').textContent = `Hiển thị ${start + 1}–${Math.min(start + SIZE,matches.length)} trên ${matches.length} phiếu`;
    $('support-pager').innerHTML = pages > 1 ? VL.pagination(state.page,pages) : '';
  }
  function reset() {
    clearTimeout(timer);
    state = { search:'', category:'', priority:'', status:'', sort:'newest', page:0 };
    $('support-search').value = ''; syncFilters(); updateURL(); render();
  }
  function syncFilters() {
    $('filter-category').value = state.category; $('filter-priority').value = state.priority; $('filter-sort').value = state.sort;
  }
  function selectTab(tab) { state.status = tab.dataset.status; state.page = 0; updateURL(); render(); }
  tabs.forEach((tab,index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); selectTab(tabs[next]); tabs[next].focus(); }
    });
  });
  $('support-search').addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => { state.search = $('support-search').value.trim(); state.page = 0; render(); },300); });
  $('filter-toggle').addEventListener('click', () => {
    const open = $('support-filters').hidden;
    $('support-filters').hidden = !open; $('filter-toggle').setAttribute('aria-expanded',String(open));
    if (open) { syncFilters(); $('filter-category').focus(); }
  });
  $('support-filters').addEventListener('submit', event => {
    event.preventDefault(); state.category = $('filter-category').value; state.priority = $('filter-priority').value; state.sort = $('filter-sort').value; state.page = 0;
    $('support-filters').hidden = true; $('filter-toggle').setAttribute('aria-expanded','false'); render(); $('filter-toggle').focus();
  });
  $('support-chips').addEventListener('click', event => {
    const button = event.target.closest('[data-remove]');
    if (!button) return;
    clearTimeout(timer); state[button.dataset.remove] = ''; state.page = 0;
    $('support-search').value = state.search; syncFilters(); updateURL(); render(); $('support-search').focus();
  });
  document.querySelector('.support-page').addEventListener('click', event => {
    if (event.target.closest('[data-reset]')) reset();
    const button = event.target.closest('[data-detail]');
    if (button) openDetail(button.dataset.detail,button);
  });
  $('support-pager').addEventListener('click', event => {
    const button = event.target.closest('[data-page]');
    if (button && !button.disabled) { state.page = Number(button.dataset.page); render(); $('support-panel').focus(); }
  });
  $('refresh-tickets').addEventListener('click', () => { readAll(); render(); VL.toast('Đã làm mới danh sách phiếu hỗ trợ.'); });
  window.addEventListener('popstate', () => { fromURL(); state.page = 0; render(); });
  window.addEventListener('storage', event => { if (event.key === null || event.key.startsWith(SupportDemo.PREFIX)) { readAll(); render(); } });

  function rawTicket(ticket) { const { user, key, ...raw } = ticket; return raw; }
  function openDetail(key, button) {
    selected = tickets.find(t => t.key === key);
    if (!selected) return;
    trigger = button;
    $('detail-id').textContent = 'Phiếu #' + selected.id;
    $('detail-title').textContent = selected.title;
    $('detail-meta').innerHTML = badge('state',selected.status,STATUS[selected.status]) + badge('priority',selected.priority,PRIORITY[selected.priority]) + `<span>${CATEGORY[selected.category]}</span>`;
    $('detail-sender').innerHTML = `<strong>${esc(selected.user.tenHienThi)}</strong><small>${esc(selected.user.email)}</small>`;
    $('detail-description').textContent = selected.description;
    $('detail-date').textContent = 'Gửi lúc ' + dateTime(selected.createdAt); $('detail-date').dateTime = selected.createdAt;
    const history = Array.isArray(selected.history) ? selected.history : [];
    $('detail-history').innerHTML = history.length ? history.map(item => `<li><strong>${esc(item.author || 'Quản trị viên')}</strong><p>${esc(item.message || '')}</p><p class="muted">${esc(item.action || '')}</p>${Number.isFinite(Date.parse(item.createdAt)) ? `<time datetime="${esc(item.createdAt)}">${dateTime(item.createdAt)}</time>` : ''}</li>`).join('') : '<li class="muted">Chưa có phản hồi được lưu trong bản mẫu.</li>';
    $('reply-form').reset(); $('reply-counter').textContent = '0/2000'; $('reply-error').textContent = ''; $('reply-content').removeAttribute('aria-invalid'); $('save-error').hidden = true;
    $('detail-status').value = selected.status; $('detail-priority').value = selected.priority;
    $('detail-dialog').showModal(); $('close-detail').focus();
  }
  function closeDetail() { if (!saving) $('detail-dialog').close(); }
  $('close-detail').addEventListener('click', closeDetail); $('cancel-detail').addEventListener('click',closeDetail);
  $('detail-dialog').addEventListener('cancel', event => { if (saving) event.preventDefault(); });
  $('detail-dialog').addEventListener('close', () => {
    if ($('detail-dialog').open) return;
    selected = null;
    if (trigger?.isConnected) trigger.focus(); else $('support-panel').focus();
  });
  $('reply-content').addEventListener('input', () => { $('reply-counter').textContent = $('reply-content').value.length + '/2000'; $('reply-error').textContent = ''; $('reply-content').removeAttribute('aria-invalid'); });
  $('reply-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (saving || !selected) return;
    const current = selected;
    const message = $('reply-content').value.trim(), status = $('detail-status').value, priority = $('detail-priority').value;
    let error = '';
    if (message.length > 2000) error = 'Phản hồi tối đa 2000 ký tự.';
    else if (!message && status === current.status && priority === current.priority) error = 'Nhập phản hồi hoặc thay đổi trạng thái, độ ưu tiên trước khi lưu.';
    else if (!message && status === 'resolved' && current.status !== 'resolved') error = 'Nhập kết quả xử lý trước khi đánh dấu đã giải quyết.';
    $('reply-error').textContent = error;
    if (error) { $('reply-content').setAttribute('aria-invalid','true'); $('reply-content').focus(); return; }
    saving = true; $('save-error').hidden = true;
    $('reply-form').setAttribute('aria-busy','true');
    $('detail-dialog').querySelectorAll('button, textarea, select').forEach(el => { el.disabled = true; });
    $('save-reply').textContent = 'Đang lưu…';
    try {
      await new Promise(resolve => setTimeout(resolve,450));
      const ownerTickets = SupportDemo.read(current.user.id), index = ownerTickets.findIndex(t => t.id === current.id);
      if (index < 0 || JSON.stringify(ownerTickets[index]) !== JSON.stringify(rawTicket(current))) throw new Error('Phiếu đã thay đổi ở cửa sổ khác. Đóng chi tiết và mở lại để xem phiên bản mới.');
      const actions = [];
      if (status !== current.status) actions.push('Trạng thái: ' + STATUS[status]);
      if (priority !== current.priority) actions.push('Ưu tiên: ' + PRIORITY[priority]);
      const now = new Date().toISOString();
      const next = { ...ownerTickets[index], status, priority, updatedAt:now, history:[...(Array.isArray(current.history) ? current.history : []), { author:VL.me().tenHienThi, message, action:actions.join(' · ') || 'Đã phản hồi học viên', createdAt:now }] };
      ownerTickets[index] = next;
      localStorage.setItem(SupportDemo.PREFIX + current.user.id,JSON.stringify(ownerTickets));
      readAll(); render(); $('detail-dialog').close(); VL.toast('Đã lưu xử lý phiếu hỗ trợ mẫu.');
    } catch (err) {
      $('save-error').textContent = err.message.includes('cửa sổ khác') ? err.message : 'Không lưu được thay đổi. Kiểm tra quyền lưu dữ liệu của trình duyệt rồi thử lại.';
      $('save-error').hidden = false;
    } finally {
      saving = false; $('reply-form').removeAttribute('aria-busy');
      $('detail-dialog').querySelectorAll('button, textarea, select').forEach(el => { el.disabled = false; });
      $('save-reply').innerHTML = VL.icon('check') + 'Lưu xử lý';
      if ($('detail-dialog').open) $('reply-content').focus();
    }
  });
  fromURL(); readAll(); render();
})();
