/* components/theme-toggle.js — qorong'i / yorug' rejim */
const KEY = 'store:theme';
const get = () => document.documentElement.dataset.theme || 'dark';

function sync() {
  const dark = get() === 'dark';
  document.querySelectorAll('.js-theme-icon').forEach(i => {
    i.className = 'js-theme-icon ' + (dark ? 'ri-moon-line' : 'ri-sun-line');
  });
}

function set(theme) {
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem(KEY, theme); } catch (e) { /* ignore */ }
  sync();
}

document.addEventListener('click', e => {
  if (e.target.closest('[data-action="theme"]')) set(get() === 'dark' ? 'light' : 'dark');
});

export const Theme = { get, set, sync };
