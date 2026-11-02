/* components/header.js — yuqori panel: menyu, tema, saralanganlar, savatcha, login */
import { esc, money } from '../data/products.js';
import { Cart } from '../store/cart.js';
import { Wishlist } from '../store/wishlist.js';
import { Theme } from './theme-toggle.js';

let getSession = () => null;   // main.js beradi (Auth bilan sikl bo'lmasligi uchun)
const root = () => document.getElementById('header');

function init(sessionFn) {
  if (sessionFn) getSession = sessionFn;
  root().innerHTML = `
    <header class="header">
      <div class="container header__inner">
        <a class="header__logo" href="#/">Store</a>
        <nav class="nav" aria-label="Main">
          <a class="nav__link" data-route="home" href="#/">Home</a>
          <a class="nav__link" data-route="products,product" href="#/products">Products</a>
          <a class="nav__link" data-route="categories" href="#/categories">Categories</a>
        </nav>
        <div class="header__actions">
          <button class="icon-btn" data-action="theme" aria-label="Toggle theme"><i class="js-theme-icon"></i></button>

          <div class="dropdown">
            <a class="icon-btn" href="#/wishlist" aria-label="Wishlist"><i class="ri-heart-line"></i><span class="badge" id="wish-badge" hidden></span></a>
            <div class="dropdown__panel"><div class="dropdown__box" id="dd-wish"></div></div>
          </div>

          <div class="dropdown">
            <a class="icon-btn" href="#/cart" aria-label="Cart"><i class="ri-shopping-cart-line"></i><span class="badge" id="cart-badge" hidden></span></a>
            <div class="dropdown__panel"><div class="dropdown__box" id="dd-cart"></div></div>
          </div>

          <div class="dropdown dropdown--user" id="dd-user"></div>

          <button class="icon-btn header__burger" data-action="burger" aria-label="Menu"><i class="ri-menu-line"></i></button>
        </div>
      </div>
    </header>`;
  Theme.sync();
  update();
}

function miniWish() {
  const items = Wishlist.items();
  if (!items.length) {
    return `<h4 class="dropdown__title">Wishlist (0)</h4>
      <p class="muted dropdown__empty">Your wishlist is empty</p>
      <a class="btn btn--primary btn--block" href="#/products">Browse products</a>`;
  }
  return `<h4 class="dropdown__title">Wishlist (${items.length})</h4>
    <ul class="mini">${items.slice(0, 4).map(p => `
      <li class="mini__item">
        <a class="mini__img" href="#/product/${p.id}"><img class="pimg" src="${esc(p.image)}" alt=""></a>
        <div class="mini__info">
          <a class="mini__title" href="#/product/${p.id}">${esc(p.title)}</a>
          <strong>${money(p.price)}</strong>
        </div>
        <button class="icon-btn icon-btn--sm" data-action="wish" data-id="${p.id}" aria-label="Remove"><i class="ri-close-line"></i></button>
      </li>`).join('')}</ul>
    ${items.length > 4 ? `<p class="muted mini__more">+${items.length - 4} more</p>` : ''}
    <a class="btn btn--primary btn--block" href="#/wishlist">View Wishlist</a>`;
}

function miniCart() {
  const rows = Cart.detailed();
  const n = Cart.count();
  if (!rows.length) {
    return `<h4 class="dropdown__title">Cart (0)</h4>
      <p class="muted dropdown__empty">Your cart is empty</p>
      <a class="btn btn--primary btn--block" href="#/cart">View Cart</a>`;
  }
  const total = rows.reduce((s, r) => s + r.product.price * r.qty, 0);
  return `<h4 class="dropdown__title">Cart (${n})</h4>
    <ul class="mini">${rows.slice(0, 4).map(r => `
      <li class="mini__item">
        <a class="mini__img" href="#/product/${r.id}"><img class="pimg" src="${esc(r.product.image)}" alt=""></a>
        <div class="mini__info">
          <a class="mini__title" href="#/product/${r.id}">${esc(r.product.title)}</a>
          <span class="muted">${r.qty} × ${money(r.product.price)}</span>
        </div>
        <button class="icon-btn icon-btn--sm" data-action="remove" data-id="${r.id}" aria-label="Remove"><i class="ri-close-line"></i></button>
      </li>`).join('')}</ul>
    ${rows.length > 4 ? `<p class="muted mini__more">+${rows.length - 4} more</p>` : ''}
    <div class="dropdown__total"><span>Total</span><strong>${money(total)}</strong></div>
    <a class="btn btn--primary btn--block" href="#/cart">View Cart</a>`;
}

function userBlock() {
  const s = getSession();
  if (!s) return `<a class="btn btn--outline" href="#/login"><i class="ri-user-line"></i> Login</a>`;
  return `<a class="btn btn--outline" href="#/account"><i class="ri-user-line"></i> ${esc(s.name.split(' ')[0])}</a>
    <div class="dropdown__panel"><div class="dropdown__box dropdown__box--sm">
      <a class="menu-link" href="#/account"><i class="ri-user-3-line"></i> My Account</a>
      <a class="menu-link" href="#/orders"><i class="ri-file-list-3-line"></i> Order History</a>
      <button class="menu-link" data-action="logout"><i class="ri-logout-box-r-line"></i> Logout</button>
    </div></div>`;
}

function badge(el, n) {
  el.hidden = n < 1;
  el.textContent = n > 99 ? '99+' : n;
}

/** Faqat ichki qismlarni yangilaydi — hover holati buzilmaydi */
function update() {
  const r = root();
  if (!r || !r.firstElementChild) return;
  badge(r.querySelector('#wish-badge'), Wishlist.count());
  badge(r.querySelector('#cart-badge'), Cart.count());
  r.querySelector('#dd-wish').innerHTML = miniWish();
  r.querySelector('#dd-cart').innerHTML = miniCart();
  r.querySelector('#dd-user').innerHTML = userBlock();
}

function setActive(name) {
  const r = root();
  if (!r) return;
  r.querySelectorAll('.nav__link').forEach(a =>
    a.classList.toggle('is-active', a.dataset.route.split(',').includes(name)));
  const nav = r.querySelector('.nav');
  if (nav) nav.classList.remove('is-open');
}

export const Header = { init, update, setActive };
