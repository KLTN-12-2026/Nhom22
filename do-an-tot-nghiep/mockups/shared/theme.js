(function () {
  'use strict';
  const key = 'vocab:theme';
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  let preference;
  try { preference = localStorage.getItem(key); } catch {}
  function apply(value) {
    document.documentElement.dataset.theme = value === 'dark' || value === 'light' ? value : system.matches ? 'dark' : 'light';
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      const dark = document.documentElement.dataset.theme === 'dark';
      const mode = value === 'dark' || value === 'light' ? value : 'system';
      button.setAttribute('aria-label', 'Giao diện: '+(mode==='system'?'Theo thiết bị':dark?'Tối':'Sáng'));
      button.setAttribute('title', 'Chọn giao diện');
      button.closest('.theme-picker')?.querySelectorAll('[data-theme-value]').forEach(option=>option.setAttribute('aria-checked',String(option.dataset.themeValue===mode)));
    });
    window.dispatchEvent(new Event('vocab-theme-change'));
  }
  const icons = '<svg class="icon theme-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.2A8.5 8.5 0 0 1 9.8 4a8.5 8.5 0 1 0 10.2 10.2Z"/></svg><svg class="icon theme-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6 19 19M5 19l1.4-1.4M17.6 6.4 19 5"/></svg>';
  window.VocabTheme = {
    set(value) {
      preference = ['light','dark'].includes(value) ? value : 'system';
      try { localStorage.setItem(key, preference); } catch {}
      apply(preference);
    },
    buttonMarkup() {
      return '<details class="theme-picker"><summary class="theme-toggle" data-theme-toggle aria-label="Chọn giao diện">'+icons+'<span class="theme-track" aria-hidden="true"></span></summary><div class="theme-options" role="radiogroup" aria-label="Giao diện"><button type="button" role="radio" data-theme-value="light">☀ Sáng</button><button type="button" role="radio" data-theme-value="dark">☾ Tối</button><button type="button" role="radio" data-theme-value="system">◐ Theo thiết bị</button></div></details>';
    },
    mount() {
      const target = document.querySelector('.header-actions, .session-bar, .onb-header-inner, .auth-main, .index-header, #main > .sheet > .form-head');
      if (!target) return;
      if (document.querySelector('[data-theme-toggle]')) { apply(preference); return; }
      target.insertAdjacentHTML('beforeend', this.buttonMarkup());
      const button = target.querySelector('[data-theme-toggle]');
      if (target.matches('.auth-main')) button.closest('.theme-picker').classList.add('theme-auth');
      apply(preference);
    }
  };
  apply(preference);
  document.addEventListener('click', event => {
    const option=event.target.closest('[data-theme-value]');
    if(option){window.VocabTheme.set(option.dataset.themeValue);const picker=option.closest('details');picker.open=false;picker.querySelector('summary').focus();}
    document.querySelectorAll('.theme-picker[open]').forEach(picker=>{if(!picker.contains(event.target))picker.open=false;});
  });
  document.addEventListener('keydown',event=>{
    const radio=event.target.closest('[data-theme-value]');
    if(radio&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)){
      event.preventDefault();const options=[...radio.parentElement.querySelectorAll('[data-theme-value]')];const index=options.indexOf(radio);
      const next=event.key==='Home'?0:event.key==='End'?options.length-1:(index+(['ArrowRight','ArrowDown'].includes(event.key)?1:-1)+options.length)%options.length;
      options[next].focus();window.VocabTheme.set(options[next].dataset.themeValue);
    }
    if(event.key==='Escape')document.querySelectorAll('.theme-picker[open]').forEach(picker=>{picker.open=false;picker.querySelector('summary').focus();});});
  system.addEventListener('change', () => { if (preference !== 'dark' && preference !== 'light') apply(null); });
  window.addEventListener('storage', event => { if (event.key === key) { preference = event.newValue; apply(preference); } });
  document.addEventListener('DOMContentLoaded', () => window.VocabTheme.mount());
})();
