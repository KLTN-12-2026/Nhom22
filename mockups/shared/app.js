(function () {
  const ICONS = {
    library: '<path d="M4 19V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2Zm0 0a2 2 0 0 0 2 2h13"/><path d="M9 7h6"/>',
    decks: '<rect x="3" y="7" width="14" height="13" rx="1.5"/><path d="M7 4h12.5A1.5 1.5 0 0 1 21 5.5V16"/><path d="M7 12h6M7 15.5h4"/>',
    practice: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>',
    notebook: '<rect x="5" y="3" width="15" height="18" rx="1.5"/><path d="M5 7H3M5 12H3M5 17H3M10 8h6M10 12h6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.4-6 8-6s6.5 2 8 6"/>',
    today: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
    download: '<path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="1.5"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>',
    star: '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5v.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.5v.01"/>',
    eye: '<path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"/><circle cx="12" cy="12" r="3"/>',
    "eye-off": '<path d="M3 3l18 18M10.6 5.1A9.6 9.6 0 0 1 12 5c6 0 9.5 7 9.5 7a15.7 15.7 0 0 1-3 3.8M6.6 6.6A15.4 15.4 0 0 0 2.5 12S6 19 12 19a9 9 0 0 0 4.2-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z"/>',
    lock: '<rect x="5" y="10" width="14" height="10" rx="1.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    volume: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4v-5Z"/><path d="M15.5 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="1.5"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
    "chevron-left": '<path d="m15 5-7 7 7 7"/>',
    "chevron-right": '<path d="m9 5 7 7-7 7"/>',
    "chevron-down": '<path d="m5 9 7 7 7-7"/>',
    "arrow-left": '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    logout: '<path d="M15 4h3.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H15"/><path d="M10 8l-4 4 4 4M6 12h10"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16Z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="m3.5 6 8.5 7 8.5-7"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    shield: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6L12 3Z"/><path d="m9 12 2 2 4-4"/>',
    tag: '<path d="M3 12V4.5A1.5 1.5 0 0 1 4.5 3H12l9 9-9 9-9-9Z"/><circle cx="8" cy="8" r="1.5"/>',
    folder: '<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2.5h8.5A1.5 1.5 0 0 1 21 9v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5v-12Z"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.3-4.9L4 8M4 4v4h4M4 13a8 8 0 0 0 14.3 4.9L20 16M20 20v-4h-4"/>',
    file: '<path d="M6 3h8l5 5v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>',
    filter: '<path d="M4 5h16l-6 7.5V19l-4 2v-8.5L4 5Z"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'
  };

  const GOAL = { GIAO_TIEP: "Giao tiếp", TOEIC: "TOEIC" };
  const LEVEL = { MOI_BAT_DAU: "Mới bắt đầu", CO_BAN: "Cơ bản", TRUNG_CAP: "Trung cấp", NANG_CAO: "Nâng cao" };
  const LEVEL_N = { MOI_BAT_DAU: 1, CO_BAN: 2, TRUNG_CAP: 3, NANG_CAO: 4 };

  const body = document.body;
  const root = body.dataset.root || "..";
  const url = (p) => root + "/" + p;
  const icon = (name, cls) => '<svg class="icon ' + (cls || "") + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || "") + "</svg>";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const params = () => Object.fromEntries(new URLSearchParams(location.search));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  const pageKey = location.pathname.split("/").slice(-2).join("/");
  const forced = () => { try { return sessionStorage.getItem("vl-force:" + pageKey) || "ready"; } catch (e) { return "ready"; } };

  async function api(method, path, data, opts) {
    await wait(260 + Math.random() * 360);
    const headers = (opts && opts.headers) || {};
    const res = window.VLDemo.handle(method, path, data, headers);
    return res.body;
  }

  function me() { try { const s = window.VLDemo.session.get(); if (!s) return null; return window.VLDemo.db.users.find((u) => u.id === s.userId) || null; } catch (e) { return null; } }
  function onboardingDone(u) { const l = window.VLDemo.db.learning[u.id]; return !!(l && l.onboardingDone); }

  function fmtDate(iso) {
    const d = new Date(iso);
    const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (diff <= 0) return "hôm nay";
    if (diff === 1) return "hôm qua";
    if (diff < 7) return diff + " ngày trước";
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  function levelHtml(level) {
    const n = LEVEL_N[level] || 0;
    let dots = "";
    for (let i = 1; i <= 4; i++) dots += '<span class="bubble' + (i <= n ? " is-filled" : "") + '"></span>';
    return '<span class="level" title="Trình độ tự đánh giá"><span class="bubble-row" aria-hidden="true">' + dots + "</span>" + esc(LEVEL[level] || "Chưa đặt") + "</span>";
  }
  function initials(name) {
    const parts = String(name || "?").trim().split(/\s+/);
    return (parts.length > 1 ? parts[parts.length - 1][0] : parts[0][0] || "?").toUpperCase();
  }
  function avatarHtml(u, cls) {
    return '<span class="avatar ' + (cls || "") + '">' + (u.anhDaiDienUrl ? '<img src="' + esc(u.anhDaiDienUrl) + '" alt="">' : esc(initials(u.tenHienThi))) + "</span>";
  }

  /* ---------- Toast ---------- */
  let toastRegion;
  function toast(message, type) {
    if (!toastRegion) {
      toastRegion = document.createElement("div");
      toastRegion.className = "toast-region";
      toastRegion.setAttribute("role", "status");
      toastRegion.setAttribute("aria-live", "polite");
      body.appendChild(toastRegion);
    }
    const el = document.createElement("div");
    el.className = "toast" + (type === "error" ? " toast-error" : "");
    el.innerHTML = icon(type === "error" ? "alert" : "check") + "<span>" + esc(message) + "</span>";
    toastRegion.appendChild(el);
    setTimeout(() => el.remove(), 3600);
  }

  /* ---------- Busy buttons ---------- */
  async function busy(btn, fn) {
    if (!btn || btn.getAttribute("aria-busy") === "true") return;
    btn.setAttribute("aria-busy", "true");
    btn.disabled = true;
    try { return await fn(); } finally { btn.removeAttribute("aria-busy"); if (!btn.dataset.countdown) btn.disabled = false; }
  }

  /* ---------- Form errors ---------- */
  function clearErrors(form) {
    form.querySelectorAll(".field[data-invalid]").forEach((f) => {
      f.removeAttribute("data-invalid");
      const input = f.querySelector("input, select, textarea");
      if (input) input.removeAttribute("aria-invalid");
    });
    const top = form.querySelector("[data-form-error]");
    if (top) { top.hidden = true; top.innerHTML = ""; }
  }
  function setFieldError(form, name, message) {
    const input = form.querySelector('[name="' + name + '"]');
    const field = (input && input.closest(".field")) || form.querySelector('[data-field="' + name + '"]');
    if (!field) return false;
    field.setAttribute("data-invalid", "");
    let err = field.querySelector(".field-error");
    if (!err) { err = document.createElement("p"); err.className = "field-error"; field.appendChild(err); }
    if (!err.id) err.id = (input && input.id ? input.id : name) + "-error";
    err.innerHTML = icon("alert", "icon-sm") + "<span>" + esc(message) + "</span>";
    if (input) {
      input.setAttribute("aria-invalid", "true");
      const d = (input.getAttribute("aria-describedby") || "").split(" ").filter(Boolean);
      if (!d.includes(err.id)) d.push(err.id);
      input.setAttribute("aria-describedby", d.join(" "));
    }
    return true;
  }
  function showErrors(form, err) {
    clearErrors(form);
    let first = null;
    (err.fieldErrors || []).forEach((f) => { if (setFieldError(form, f.field, f.message) && !first) first = form.querySelector('[name="' + f.field + '"]'); });
    const shownInline = (err.fieldErrors || []).length && first;
    if (!shownInline) {
      const top = form.querySelector("[data-form-error]");
      if (top) {
        top.hidden = false;
        top.className = "notice notice-danger";
        top.innerHTML = icon("alert") + '<div><p class="notice-title">' + esc(err.message || "Có lỗi xảy ra") + '</p><p class="request-id">Mã yêu cầu: ' + esc(err.requestId || "—") + "</p></div>";
        top.focus && top.setAttribute("tabindex", "-1");
        top.focus && top.focus();
      } else toast(err.message || "Có lỗi xảy ra", "error");
    }
    if (first) first.focus();
  }

  /* ---------- Password helpers, countdown ---------- */
  function bindPassword(input, rulesEl) {
    const toggle = input.parentElement.querySelector("[data-toggle-password]");
    if (toggle) toggle.addEventListener("click", () => {
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      toggle.setAttribute("aria-label", show ? "Ẩn mật khẩu" : "Hiện mật khẩu");
      toggle.setAttribute("aria-pressed", String(show));
      toggle.innerHTML = icon(show ? "eye-off" : "eye");
    });
    if (!rulesEl) return;
    const rules = { len: (v) => v.length >= 8 && v.length <= 72, letter: (v) => /[A-Za-z]/.test(v), digit: (v) => /\d/.test(v) };
    const update = () => rulesEl.querySelectorAll("[data-rule]").forEach((li) => li.toggleAttribute("data-ok", rules[li.dataset.rule](input.value)));
    input.addEventListener("input", update);
    update();
  }
  function countdown(btn, seconds, label) {
    if (btn.dataset.countdown) return;
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.dataset.countdown = "1";
    let left = seconds;
    const tick = () => {
      if (left <= 0) { btn.disabled = false; btn.innerHTML = original; delete btn.dataset.countdown; return; }
      btn.textContent = (label || "Thử lại sau") + " " + left + " giây";
      left -= 1;
      setTimeout(tick, 1000);
    };
    tick();
  }

  /* ---------- Region loader ---------- */
  async function load(region, opts) {
    const state = forced();
    region.setAttribute("data-view", "loading");
    region.setAttribute("aria-busy", "true");
    try {
      if (state === "loading") return;
      if (state === "error") { await wait(500); throw new window.VLDemo.ApiError(503, "DEPENDENCY_DOWN", "Không tải được dữ liệu. Kiểm tra kết nối rồi thử lại."); }
      const data = await opts.fetch();
      const empty = state === "empty" || (opts.isEmpty ? opts.isEmpty(data) : false);
      if (empty) { if (opts.empty) opts.empty(data); region.setAttribute("data-view", "empty"); }
      else { opts.render(data); region.setAttribute("data-view", "ready"); }
      return data;
    } catch (err) {
      if (err && err.status === 401) { location.href = url("dot1/dang-nhap.html?next=" + encodeURIComponent(pageKey + location.search)); return; }
      const box = region.querySelector('[data-when~="error"]');
      if (box) {
        box.innerHTML = '<div class="error-state" role="alert">' + icon("alert", "icon-lg") + "<h2>" + esc(opts.errorTitle || "Chưa tải được dữ liệu") + "</h2><p>" + esc(err.message || "Có lỗi xảy ra") + '</p><div class="row"><button type="button" class="btn btn-secondary" data-retry>' + icon("refresh") + 'Thử lại</button></div><p class="request-id">Mã yêu cầu: ' + esc(err.requestId || "—") + "</p></div>";
        box.querySelector("[data-retry]").addEventListener("click", () => { try { sessionStorage.removeItem("vl-force:" + pageKey); } catch (e) {} syncMockBar(); load(region, opts); });
      }
      region.setAttribute("data-view", "error");
    } finally {
      region.removeAttribute("aria-busy");
    }
  }

  /* ---------- Confirm dialog ---------- */
  function confirmDialog({ title, message, confirmText, danger }) {
    return new Promise((resolve) => {
      const d = document.createElement("dialog");
      d.className = "dialog";
      d.setAttribute("aria-labelledby", "cd-title");
      d.innerHTML = '<form method="dialog" class="dialog-body"><div class="dialog-head"><h2 id="cd-title">' + esc(title) + '</h2></div><p>' + esc(message) + '</p><div class="dialog-actions"><button value="cancel" class="btn btn-quiet">Hủy</button><button value="ok" class="btn ' + (danger ? "btn-danger-solid" : "btn-primary") + '">' + esc(confirmText || "Xác nhận") + "</button></div></form>";
      body.appendChild(d);
      d.addEventListener("close", () => { resolve(d.returnValue === "ok"); d.remove(); });
      d.showModal();
    });
  }

  /* ---------- Shell ---------- */
  const NAV = [
    { group: "Học tập", items: [
      { key: "today", label: "Hôm nay", icon: "today", soon: "Đợt 2" },
      { key: "decks", label: "Bộ của tôi", icon: "decks", href: "dot1/bo-the.html" },
      { key: "library", label: "Thư viện", icon: "library", href: "dot1/thu-vien.html" },
      { key: "practice", label: "Luyện tập", icon: "practice", soon: "Đợt 2" },
      { key: "notebook", label: "Sổ tay", icon: "notebook", soon: "Đợt 2" }
    ] },
    { group: "Tài khoản", items: [
      { key: "profile", label: "Hồ sơ", icon: "user", href: "dot1/ca-nhan.html" },
      { key: "learning", label: "Thiết lập học", icon: "target", href: "dot1/ca-nhan-hoc-tap.html" },
      { key: "security", label: "Bảo mật", icon: "shield", href: "dot1/ca-nhan-bao-mat.html" },
      { key: "notify", label: "Thông báo & nhắc học", icon: "bell", href: "dot1/ca-nhan-thong-bao.html" }
    ] },
    { group: "Quản trị", admin: true, items: [
      { key: "admin-topics", label: "Chủ đề & nhãn", icon: "folder", href: "dot1/quan-tri-chu-de.html" }
    ] }
  ];
  const BOTTOM = [
    { key: "decks", label: "Học", icon: "decks", href: "dot1/bo-the.html", also: ["deck-new"] },
    { key: "library", label: "Thư viện", icon: "library", href: "dot1/thu-vien.html" },
    { key: "practice", label: "Luyện tập", icon: "practice", soon: "Đợt 2" },
    { key: "notebook", label: "Sổ tay", icon: "notebook", soon: "Đợt 2" },
    { key: "me", label: "Tôi", icon: "user", href: "dot1/ca-nhan.html", also: ["profile", "learning", "security", "notify", "admin-topics"] }
  ];

  function renderAppShell(u) {
    const nav = body.dataset.nav;
    const header = document.querySelector(".app-header");
    if (header) {
      header.innerHTML =
        '<a class="brand" href="' + url("dot1/bo-the.html") + '"><img class="brand-mark" src="' + url("shared/assets/logo-mark.svg") + '" alt="" width="28" height="28"><span>Vocab<span class="brand-accent">Learning</span></span></a>' +
        '<div class="header-actions"><a class="user-chip" href="' + url("dot1/ca-nhan.html") + '" aria-label="Hồ sơ của ' + esc(u.tenHienThi) + '">' + avatarHtml(u) + '<span class="user-name">' + esc(u.tenHienThi) + "</span></a>" +
        '<button type="button" class="btn btn-quiet btn-icon" data-logout aria-label="Đăng xuất" title="Đăng xuất">' + icon("logout") + "</button></div>";
    }
    const side = document.querySelector(".sidebar");
    if (side) {
      side.setAttribute("aria-label", "Điều hướng chính");
      side.innerHTML = NAV.filter((g) => !g.admin || u.vaiTro.includes("ADMIN")).map((g) =>
        '<div class="nav-group"><p class="nav-group-title">' + esc(g.group) + "</p>" + g.items.map((it) => it.soon
          ? '<span class="nav-link" aria-disabled="true"><span class="nav-dot"></span>' + esc(it.label) + '<span class="nav-soon">' + esc(it.soon) + "</span></span>"
          : '<a class="nav-link" href="' + url(it.href) + '"' + (it.key === nav ? ' aria-current="page"' : "") + '><span class="nav-dot"></span>' + esc(it.label) + "</a>").join("") + "</div>").join("");
    }
    const bottom = document.querySelector(".bottom-nav");
    if (bottom) {
      bottom.setAttribute("aria-label", "Điều hướng chính");
      bottom.innerHTML = BOTTOM.map((it) => {
        const cur = it.key === nav || (it.also || []).includes(nav);
        if (it.soon) return '<span aria-disabled="true" title="Có ở ' + esc(it.soon) + '"><span class="nav-bubble">' + icon(it.icon) + "</span>" + esc(it.label) + "</span>";
        return '<a href="' + url(it.href) + '"' + (cur ? ' aria-current="page"' : "") + '><span class="nav-bubble">' + icon(it.icon) + "</span>" + esc(it.label) + "</a>";
      }).join("");
    }
  }

  function renderPublicShell() {
    const app = document.querySelector(".app");
    if (!app) return;
    const header = app.querySelector(".app-header");
    const nav = body.dataset.nav;
    const site = document.createElement("header");
    site.className = "site-header";
    site.innerHTML = publicHeaderInner(nav);
    if (header) header.replaceWith(site);
    app.querySelectorAll(".sidebar, .bottom-nav").forEach((n) => n.remove());
    body.classList.add("no-bottom-nav");
    const main = app.querySelector(".app-main");
    if (main) main.style.paddingBottom = "var(--sp-7)";
  }
  function publicHeaderInner(nav) {
    const link = (key, href, label) => '<a href="' + url(href) + '"' + (key === nav ? ' aria-current="page"' : "") + ">" + label + "</a>";
    return '<div class="site-header-inner"><a class="brand" href="' + url("gd0/trang-chu.html") + '"><img class="brand-mark" src="' + url("shared/assets/logo-mark.svg") + '" alt="" width="28" height="28"><span>Vocab<span class="brand-accent">Learning</span></span></a>' +
      '<nav class="site-nav" aria-label="Trang công khai">' + link("library", "dot1/thu-vien.html", "Thư viện") + link("guide", "gd0/huong-dan.html", "Cách học") + link("policy", "gd0/chinh-sach.html", "Chính sách") + "</nav>" +
      '<div class="header-actions"><a class="btn btn-quiet" href="' + url("dot1/dang-nhap.html") + '">Đăng nhập</a><a class="btn btn-primary" href="' + url("dot1/dang-ky.html") + '">Tạo tài khoản</a></div></div>';
  }

  /* ---------- Mock bar ---------- */
  function syncMockBar() {
    const bar = document.querySelector(".mock-bar");
    if (!bar) return;
    const s = forced();
    bar.querySelectorAll("[data-force]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.force === s)));
    const label = bar.querySelector("[data-mock-label]");
    if (label) label.textContent = { ready: "Có dữ liệu", loading: "Đang tải", empty: "Trống", error: "Lỗi" }[s];
  }
  function mountMockBar() {
    const hasRegions = document.querySelector("[data-view]");
    const d = document.createElement("details");
    d.className = "mock-bar";
    d.innerHTML = '<summary>Mockup: <span data-mock-label></span></summary><div class="mock-options">' +
      (hasRegions ? '<button type="button" data-force="ready">Có dữ liệu</button><button type="button" data-force="loading">Đang tải</button><button type="button" data-force="empty">Trống</button><button type="button" data-force="error">Lỗi</button>' : "") +
      '<button type="button" data-reset>Đặt lại dữ liệu mẫu</button><a class="btn btn-sm" style="color:#d6d8e0" href="' + url("index.html") + '">Danh sách mockup</a></div>';
    body.appendChild(d);
    d.querySelectorAll("[data-force]").forEach((b) => b.addEventListener("click", () => {
      try { sessionStorage.setItem("vl-force:" + pageKey, b.dataset.force); } catch (e) {}
      location.reload();
    }));
    d.querySelector("[data-reset]").addEventListener("click", () => { window.VLDemo.reset(); location.reload(); });
    syncMockBar();
    if (!hasRegions) { const l = d.querySelector("[data-mock-label]"); if (l) l.textContent = "dữ liệu mẫu"; }
  }

  /* ---------- Image slots ---------- */
  function mountImageSlots() {
    document.querySelectorAll(".img-slot[data-src]").forEach((slot) => {
      const img = new Image();
      img.alt = slot.dataset.alt || "";
      img.onload = () => slot.appendChild(img);
      img.src = slot.dataset.src;
    });
  }

  /* ---------- Auth brand panel ---------- */
  function fillAuthAside() {
    const aside = document.querySelector(".auth-aside:empty");
    if (!aside) return;
    const opts = [["A", "lời mời"], ["B", "biên lai, giấy biên nhận"], ["C", "công thức nấu ăn"], ["D", "người nhận"]];
    aside.innerHTML =
      '<a class="brand" href="' + url("gd0/trang-chu.html") + '"><img class="brand-mark" src="' + url("shared/assets/logo-mark-inverse.svg") + '" alt="" width="28" height="28"><span>Vocab<span class="brand-accent">Learning</span></span></a>' +
      '<figure class="aside-sheet" aria-label="Ví dụ một câu hỏi từ vựng">' +
      '<div class="aside-q"><span class="aside-no">Câu 14</span><span class="aside-dir">Anh → Việt</span></div>' +
      '<p class="aside-word" lang="en">receipt</p><p class="aside-ipa" lang="en">/rɪˈsiːt/ <em>n.</em></p>' +
      '<ol class="aside-options" role="list">' + opts.map((o) => '<li><span class="bubble' + (o[0] === "B" ? " aside-pick" : "") + '">' + o[0] + "</span>" + esc(o[1]) + "</li>").join("") + "</ol>" +
      '<figcaption>Mỗi từ có hai chiều học, mỗi chiều một lịch ôn riêng.</figcaption></figure>' +
      '<ul class="aside-facts" role="list"><li>Bộ mẫu Giao tiếp và TOEIC để bắt đầu ngay</li><li>Ôn đúng lúc bằng lịch lặp lại ngắt quãng</li><li>Tự tạo bộ thẻ, nhập từ tệp CSV</li></ul>';
    const pick = aside.querySelector(".aside-pick");
    setTimeout(() => pick && pick.classList.add("is-filled"), 700);
  }

  /* ---------- Boot ---------- */
  function boot() {
    const skip = document.createElement("a");
    skip.className = "skip-link";
    skip.href = "#main";
    skip.textContent = "Bỏ qua điều hướng";
    body.prepend(skip);

    const as = params().as;
    if (as) {
      const acc = window.VLDemo.db.users.find((x) => x.email.split("@")[0] === as);
      if (acc) window.VLDemo.session.set({ userId: acc.id });
    }
    const auth = body.dataset.auth;
    const u = me();
    if (auth === "required" && !u) {
      location.replace(url("dot1/dang-nhap.html?next=" + encodeURIComponent(pageKey + location.search)));
      return false;
    }
    if (auth === "guest" && u && body.dataset.guestRedirect !== "off") {
      location.replace(url(onboardingDone(u) ? "dot1/bo-the.html" : "dot1/bat-dau.html"));
      return false;
    }
    if (u && auth === "required" && body.dataset.onboarding !== "skip" && body.dataset.role !== "ADMIN" && !onboardingDone(u)) {
      location.replace(url("dot1/bat-dau.html"));
      return false;
    }
    if (body.dataset.role === "ADMIN" && u && !u.vaiTro.includes("ADMIN")) {
      const main = document.querySelector("#main");
      if (main) main.innerHTML = '<div class="page sheet"><div class="error-state" role="alert">' + icon("lock", "icon-lg") + '<h1>Bạn không có quyền vào trang này</h1><p>Trang quản trị chỉ dành cho tài khoản quản trị viên.</p><a class="btn btn-secondary" href="' + url("dot1/bo-the.html") + '">Về Bộ của tôi</a></div></div>';
    }
    if (document.querySelector(".app")) { if (u) renderAppShell(u); else renderPublicShell(); }
    const siteHeader = document.querySelector("header.site-header:empty");
    if (siteHeader) siteHeader.innerHTML = u
      ? '<div class="site-header-inner"><a class="brand" href="' + url("gd0/trang-chu.html") + '"><img class="brand-mark" src="' + url("shared/assets/logo-mark.svg") + '" alt="" width="28" height="28"><span>Vocab<span class="brand-accent">Learning</span></span></a><nav class="site-nav" aria-label="Trang công khai"><a href="' + url("dot1/thu-vien.html") + '">Thư viện</a><a href="' + url("gd0/huong-dan.html") + '"' + (body.dataset.nav === "guide" ? ' aria-current="page"' : "") + '>Cách học</a><a href="' + url("gd0/chinh-sach.html") + '"' + (body.dataset.nav === "policy" ? ' aria-current="page"' : "") + '>Chính sách</a></nav><div class="header-actions"><a class="btn btn-primary" href="' + url("dot1/bo-the.html") + '">Vào học</a></div></div>'
      : publicHeaderInner(body.dataset.nav);

    document.addEventListener("click", async (e) => {
      const lo = e.target.closest("[data-logout]");
      if (!lo) return;
      await busy(lo, () => api("POST", "/auth/logout"));
      location.href = url("dot1/dang-nhap.html?loggedOut=1");
    });
    fillAuthAside();
    mountMockBar();
    mountImageSlots();
    return true;
  }

  window.VL = { root, url, icon, esc, params, api, me, toast, busy, showErrors, clearErrors, setFieldError, load, confirm: confirmDialog, bindPassword, countdown, fmtDate, levelHtml, avatarHtml, initials, GOAL, LEVEL, ready: false };
  window.VL.ready = boot();
})();
