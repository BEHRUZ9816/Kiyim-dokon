/* main.js — kirish nuqtasi: router, sahifalar, hodisalar */
import { esc, money, read, write, emit, imgFallback, Products } from './data/products.js';
import { Cart } from './store/cart.js';
import { Wishlist } from './store/wishlist.js';
import { Header } from './components/header.js';
import { Footer } from './components/footer.js';
const $ = (s, r = document) => r.querySelector(s);

let ready = false;          // mahsulotlar yuklanganmi
const state = { q: '' };    // qidiruv matni

/* =========================================================
   Auth (demo: ma'lumotlar brauzerning localStorage'ida)
   Haqiqiy loyihada parol serverda hash qilinishi kerak!
========================================================= */
const Auth = {
  users: () => read('store:users', []),
  session: () => read('store:session', null),
  register({ name, email, password }) {
    email = email.trim().toLowerCase();
    const users = this.users();
    if (users.some(u => u.email === email)) return { ok: false, error: 'This email is already registered.' };
    users.push({ name: name.trim(), email, password });
    write('store:users', users);
    write('store:session', { name: name.trim(), email });
    emit('auth');
    return { ok: true };
  },
  login(email, password) {
    email = email.trim().toLowerCase();
    const u = this.users().find(u => u.email === email && u.password === password);
    if (!u) return { ok: false, error: 'Invalid email or password.' };
    write('store:session', { name: u.name, email: u.email });
    emit('auth');
    return { ok: true };
  },
  logout() { localStorage.removeItem('store:session'); emit('auth'); }
};

const Orders = {
  all: () => read('store:orders', []),
  mine() {
    const s = Auth.session();
    return s ? this.all().filter(o => o.email === s.email).reverse() : [];
  },
  add(order) { write('store:orders', [...this.all(), order]); }
};

/* =========================================================
   Yordamchi funksiyalar
========================================================= */
function toast(msg, type = 'success') {
  const box = $('#toasts');
  const el = document.createElement('div');
  el.className = 'toast toast--' + type;
  el.innerHTML = `<i class="${type === 'error' ? 'ri-error-warning-line' : 'ri-checkbox-circle-line'}"></i><span>${esc(msg)}</span>`;
  box.appendChild(el);
  requestAnimationFrame(() => el.classList.add('is-show'));
  setTimeout(() => { el.classList.remove('is-show'); setTimeout(() => el.remove(), 250); }, 2400);
}

function route() {
  let h = location.hash.replace(/^#\/?/, '');
  try { h = decodeURIComponent(h); } catch (e) { /* ignore */ }
  const parts = h.split('/').filter(Boolean);
  return { name: parts[0] || 'home', arg: parts.slice(1).join('/') };
}

function go(hash) {
  let cur = location.hash;
  try { cur = decodeURIComponent(cur); hash = decodeURIComponent(hash); } catch (e) { /* ignore */ }
  if (cur === hash) render(); else location.hash = hash;
}

function stars(rate) {
  let h = '';
  for (let i = 1; i <= 5; i++) {
    h += rate >= i ? '<i class="ri-star-fill"></i>' : rate >= i - 0.5 ? '<i class="ri-star-half-fill"></i>' : '<i class="ri-star-line"></i>';
  }
  return `<span class="stars">${h}</span>`;
}

const emptyState = (icon, title, text, action = '') =>
  `<div class="empty"><i class="${icon}"></i><h2>${title}</h2><p class="muted">${text}</p>${action}</div>`;
const loader = () => `<section class="container page"><div class="grid">${'<div class="card card--skeleton"></div>'.repeat(4)}</div></section>`;
const notFound = () => `<section class="container page">${emptyState('ri-compass-3-line', 'Page not found', 'The page you are looking for does not exist.', '<a class="btn btn--primary" href="#/">Back to store</a>')}</section>`;

/* =========================================================
   Mahsulot kartochkasi
========================================================= */
function card(p) {
  const w = Wishlist.has(p.id);
  return `
    <article class="card" data-id="${p.id}">
      <div class="card__media">
        <img class="pimg" src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy">
        <button class="card__wish ${w ? 'is-active' : ''}" data-action="wish" data-id="${p.id}" aria-label="Wishlist"><i class="${w ? 'ri-heart-fill' : 'ri-heart-line'}"></i></button>
        <div class="card__actions">
          <button data-action="view" data-id="${p.id}" aria-label="View details"><i class="ri-eye-line"></i></button>
          <button data-action="add" data-id="${p.id}" aria-label="Add to cart"><i class="ri-shopping-cart-line"></i></button>
        </div>
      </div>
      <div class="card__body">
        <a class="card__title" href="#/product/${p.id}">${esc(p.title)}</a>
        <p class="card__desc">${esc(p.description)}</p>
        <p class="card__price">${money(p.price)}</p>
        <button class="btn btn--primary btn--block" data-action="add" data-id="${p.id}">Add to Cart</button>
      </div>
    </article>`;
}

/* =========================================================
   Sahifalar
========================================================= */
function pageStore(r) {
  const cat = r.name === 'products' ? r.arg : '';
  const title = r.name === 'home' ? 'Online Store' : cat ? Products.title(cat) : 'All Products';
  return `
    <section class="container page">
      <h1 class="page__title">${esc(title)}</h1>
      <div class="toolbar">
        <label class="search"><i class="ri-search-line"></i>
          <input id="search" type="search" placeholder="Search products..." value="${esc(state.q)}" autocomplete="off">
        </label>
        <button class="btn btn--outline btn--filter" data-action="open-filter"><i class="ri-filter-3-line"></i> Filter</button>
      </div>
      <div id="grid" class="grid"></div>
    </section>`;
}

function fillGrid() {
  const grid = $('#grid');
  if (!grid) return;
  if (!ready) { grid.innerHTML = '<div class="card card--skeleton"></div>'.repeat(8); return; }
  const r = route();
  const list = Products.filter({ q: state.q, category: r.name === 'products' ? r.arg : '' });
  grid.innerHTML = list.length
    ? list.map(card).join('')
    : `<div class="grid__empty">${emptyState('ri-search-line', 'No products found', 'Try a different search or clear the filters.', '<button class="btn btn--outline" data-action="clear-filters">Clear Filters</button>')}</div>`;
}

function pageCategories() {
  return `
    <section class="container page">
      <h1 class="page__title">Categories</h1>
      <div class="cat-grid">
        ${Products.categories.map(c => `
          <div class="cat-card">
            <h2>${esc(c.title)}</h2>
            <p class="muted">Browse all ${esc(c.title.toLowerCase())} products</p>
            <a class="btn btn--outline btn--block" href="#/products/${encodeURIComponent(c.key)}">View Products</a>
          </div>`).join('')}
      </div>
    </section>`;
}

function pageProduct(r) {
  const p = Products.get(r.arg);
  if (!p) return notFound();
  const inCart = Cart.get(p.id);
  const w = Wishlist.has(p.id);
  const rel = Products.related(p);
  return `
    <section class="container page product">
      <nav class="crumbs">
        <a href="#/">Home</a><i class="ri-arrow-right-s-line"></i>
        <a href="#/products/${encodeURIComponent(p.category)}">${esc(Products.label(p.category))}</a><i class="ri-arrow-right-s-line"></i>
        <span>${esc(p.title)}</span>
      </nav>

      <div class="product__layout">
        <div class="product__gallery">
          <div class="product__img">
            <img class="pimg" src="${esc(p.image)}" alt="${esc(p.title)}">
            <button class="card__wish ${w ? 'is-active' : ''}" data-action="wish" data-id="${p.id}" aria-label="Wishlist"><i class="${w ? 'ri-heart-fill' : 'ri-heart-line'}"></i></button>
          </div>
        </div>

        <div class="product__info">
          <span class="chip">${esc(Products.label(p.category))}</span>
          <h1>${esc(p.title)}</h1>
          <div class="rating">${stars(p.rating.rate)} <strong>${p.rating.rate}</strong> <span class="muted">· ${p.rating.count} reviews</span></div>
          <h2>About this product</h2>
          <p class="product__desc">${esc(p.description)}</p>
          <h2>Details</h2>
          <dl class="specs">
            <div><dt>Category</dt><dd>${esc(Products.label(p.category))}</dd></div>
            <div><dt>Product ID</dt><dd>#${p.id}</dd></div>
            <div><dt>Rating</dt><dd>${p.rating.rate} / 5</dd></div>
            <div><dt>Reviews</dt><dd>${p.rating.count}</dd></div>
          </dl>
        </div>

        <aside class="buybox">
          <p class="buybox__price">${money(p.price)}</p>
          <ul class="buybox__perks">
            <li><i class="ri-truck-line"></i> Free delivery</li>
            <li><i class="ri-arrow-go-back-line"></i> 30-day returns</li>
            <li><i class="ri-checkbox-circle-line"></i> In stock</li>
          </ul>
          ${inCart
            ? `<a class="btn btn--primary btn--lg btn--block" href="#/cart"><i class="ri-shopping-cart-fill"></i> Go to Cart (${inCart.qty})</a>`
            : `<button class="btn btn--primary btn--lg btn--block" data-action="add" data-id="${p.id}"><i class="ri-shopping-cart-line"></i> Add to Cart</button>`}
          <button class="btn btn--outline btn--lg btn--block" data-action="buy-now" data-id="${p.id}">Buy now</button>
          <button class="btn btn--outline btn--block" data-action="wish" data-id="${p.id}"><i class="${w ? 'ri-heart-fill' : 'ri-heart-line'}"></i> ${w ? 'In Wishlist' : 'Add to Wishlist'}</button>
        </aside>
      </div>

      ${rel.length ? `<h2 class="section-title">You may also like</h2><div class="grid">${rel.map(card).join('')}</div>` : ''}
    </section>`;
}

function cartRow(r) {
  const p = r.product;
  const w = Wishlist.has(p.id);
  return `
    <article class="cart-item">
      <label class="check"><input type="checkbox" data-action="select" data-id="${p.id}" ${r.selected ? 'checked' : ''}><span></span></label>
      <a class="cart-item__img" href="#/product/${p.id}"><img class="pimg" src="${esc(p.image)}" alt=""></a>
      <div class="cart-item__info">
        <a class="cart-item__title" href="#/product/${p.id}">${esc(p.title)}</a>
        <span class="muted">${esc(Products.label(p.category))}</span>
        <div class="qty">
          <button data-action="dec" data-id="${p.id}" ${r.qty <= 1 ? 'disabled' : ''} aria-label="Decrease"><i class="ri-subtract-line"></i></button>
          <span>${r.qty}</span>
          <button data-action="inc" data-id="${p.id}" aria-label="Increase"><i class="ri-add-line"></i></button>
        </div>
      </div>
      <div class="cart-item__side">
        <strong>${money(p.price * r.qty)}</strong>
        <small class="muted">${money(p.price)} each</small>
        <div class="cart-item__btns">
          <button class="icon-btn icon-btn--sm ${w ? 'is-active' : ''}" data-action="wish" data-id="${p.id}" aria-label="Wishlist"><i class="${w ? 'ri-heart-fill' : 'ri-heart-line'}"></i></button>
          <button class="icon-btn icon-btn--sm" data-action="remove" data-id="${p.id}" aria-label="Remove"><i class="ri-delete-bin-line"></i></button>
        </div>
      </div>
    </article>`;
}

function pageCart() {
  const rows = Cart.detailed();
  if (!rows.length) {
    return `<section class="container page"><h1 class="page__title">Cart</h1>${emptyState('ri-shopping-cart-line', 'Your cart is empty', 'Browse the store and add something you like.', '<a class="btn btn--primary" href="#/products">Continue shopping</a>')}</section>`;
  }
  const sel = rows.filter(r => r.selected);
  const selQty = sel.reduce((s, r) => s + r.qty, 0);
  const total = Cart.total();
  return `
    <section class="container page">
      <h1 class="page__title">Cart <small>${Cart.count()} items</small></h1>
      <div class="cart">
        <div class="cart__list">
          <div class="cart__bar">
            <label class="check"><input type="checkbox" data-action="select-all" ${sel.length === rows.length ? 'checked' : ''}><span></span><b>Select all</b></label>
            <button class="link-btn" data-action="remove-selected" ${sel.length ? '' : 'disabled'}><i class="ri-delete-bin-line"></i> Delete selected</button>
          </div>
          ${rows.map(cartRow).join('')}
        </div>
        <aside class="summary">
          <h2>Order summary</h2>
          <div class="summary__row"><span>Items (${selQty})</span><span>${money(total)}</span></div>
          <div class="summary__row"><span>Delivery</span><span class="ok">Free</span></div>
          <div class="summary__row summary__row--total"><span>Total</span><strong>${money(total)}</strong></div>
          <button class="btn btn--primary btn--lg btn--block" data-action="checkout" ${sel.length ? '' : 'disabled'}>Checkout</button>
          <p class="muted summary__note">${sel.length ? `${sel.length} product(s) selected` : 'Select at least one product'}</p>
        </aside>
      </div>
    </section>`;
}

function pageWishlist() {
  const items = Wishlist.items();
  if (!items.length) {
    return `<section class="container page"><h1 class="page__title">Wishlist</h1>${emptyState('ri-heart-line', 'Your wishlist is empty', 'Tap the heart on any product to save it here.', '<a class="btn btn--primary" href="#/products">Browse products</a>')}</section>`;
  }
  return `
    <section class="container page">
      <div class="page__head">
        <h1 class="page__title">Wishlist <small>${items.length} items</small></h1>
        <div class="page__actions">
          <button class="btn btn--primary" data-action="wish-add-all"><i class="ri-shopping-cart-line"></i> Add all to Cart</button>
          <button class="btn btn--outline" data-action="wish-clear"><i class="ri-delete-bin-line"></i> Clear</button>
        </div>
      </div>
      <div class="grid">${items.map(card).join('')}</div>
    </section>`;
}

function pageLogin() {
  return `
    <section class="container auth">
      <div class="auth__card">
        <h1>Login</h1>
        <p class="muted">Enter your credentials to access your account</p>
        <form data-form="login" novalidate>
          <div class="field"><label for="email">Email</label><input id="email" name="email" type="email" placeholder="your@email.com" autocomplete="email"></div>
          <div class="field"><label for="password">Password</label><input id="password" name="password" type="password" placeholder="••••••••" autocomplete="current-password"></div>
          <p class="form__error" hidden></p>
          <button class="btn btn--primary btn--lg btn--block" type="submit">Login</button>
        </form>
        <p class="auth__alt">Don't have an account? <a href="#/register">Register</a></p>
      </div>
    </section>`;
}

function pageRegister() {
  return `
    <section class="container auth">
      <div class="auth__card">
        <h1>Create an Account</h1>
        <p class="muted">Enter your details to create a new account</p>
        <form data-form="register" novalidate>
          <div class="field"><label for="name">Full Name</label><input id="name" name="name" type="text" placeholder="John Doe" autocomplete="name"></div>
          <div class="field"><label for="email">Email</label><input id="email" name="email" type="email" placeholder="your@email.com" autocomplete="email"></div>
          <div class="field"><label for="password">Password</label><input id="password" name="password" type="password" placeholder="••••••••" autocomplete="new-password"></div>
          <div class="field"><label for="confirm">Confirm Password</label><input id="confirm" name="confirm" type="password" placeholder="••••••••" autocomplete="new-password"></div>
          <p class="form__error" hidden></p>
          <button class="btn btn--primary btn--lg btn--block" type="submit">Register</button>
        </form>
        <p class="auth__alt">Already have an account? <a href="#/login">Login</a></p>
      </div>
    </section>`;
}

function pageAccount() {
  const s = Auth.session();
  return `
    <section class="container auth">
      <div class="auth__card account">
        <div class="account__avatar">${esc(s.name.charAt(0).toUpperCase())}</div>
        <h1>${esc(s.name)}</h1>
        <p class="muted">${esc(s.email)}</p>
        <div class="account__stats">
          <div><strong>${Orders.mine().length}</strong><span class="muted">Orders</span></div>
          <div><strong>${Wishlist.count()}</strong><span class="muted">Wishlist</span></div>
          <div><strong>${Cart.count()}</strong><span class="muted">In cart</span></div>
        </div>
        <a class="btn btn--outline btn--block" href="#/orders"><i class="ri-file-list-3-line"></i> Order History</a>
        <button class="btn btn--primary btn--block" data-action="logout"><i class="ri-logout-box-r-line"></i> Logout</button>
      </div>
    </section>`;
}

function pageOrders() {
  const orders = Orders.mine();
  if (!orders.length) {
    return `<section class="container page"><h1 class="page__title">Order History</h1>${emptyState('ri-file-list-3-line', 'No orders yet', 'Your completed orders will appear here.', '<a class="btn btn--primary" href="#/products">Start shopping</a>')}</section>`;
  }
  return `
    <section class="container page">
      <h1 class="page__title">Order History <small>${orders.length} orders</small></h1>
      <div class="orders">
        ${orders.map(o => `
          <article class="order">
            <header class="order__head">
              <div><strong>Order ${esc(o.id)}</strong><span class="muted">${new Date(o.date).toLocaleString()}</span></div>
              <strong class="order__total">${money(o.total)}</strong>
            </header>
            <ul>
              ${o.items.map(i => `
                <li class="order__item">
                  <img class="pimg" src="${esc(i.image)}" alt="">
                  <a href="#/product/${i.id}">${esc(i.title)}</a>
                  <span class="muted">${i.qty} × ${money(i.price)}</span>
                </li>`).join('')}
            </ul>
          </article>`).join('')}
      </div>
    </section>`;
}

const INFO = {
  privacy: ['Privacy Policy', 'We store your cart, wishlist and account details only in your own browser. We do not sell or share personal information with third parties.', 'You can clear all saved data at any time by clearing your browser storage.'],
  terms: ['Terms of Service', 'By using this demo store you agree to use it for lawful purposes only. Prices and products are provided for demonstration.', 'Orders placed here are saved locally and are not charged.'],
  shipping: ['Shipping Policy', 'Delivery is free on every order. Standard delivery takes 3–7 business days.', 'Items can be returned within 30 days of delivery in their original condition.']
};

function pageInfo(r) {
  const d = INFO[r.arg];
  if (!d) return notFound();
  return `<section class="container page info"><h1 class="page__title">${d[0]}</h1>${d.slice(1).map(t => `<p>${t}</p>`).join('')}</section>`;
}

/* =========================================================
   Filtr paneli (o'ngdan chiqadi)
========================================================= */
function renderDrawer() {
  $('#drawer-root').innerHTML = `
    <div class="overlay" data-action="close-filter"></div>
    <aside class="drawer" aria-label="Filter products">
      <button class="drawer__close" data-action="close-filter" aria-label="Close"><i class="ri-close-line"></i></button>
      <h2>Filter Products</h2>
      <p class="muted">Narrow down products by applying filters</p>
      <label class="drawer__label">Category</label>
      <div class="select">
        <button class="select__btn" data-action="toggle-select"><span id="select-label">All Categories</span><i class="ri-arrow-down-s-line"></i></button>
        <ul class="select__list" hidden>
          <li><button data-action="pick-cat" data-value="">All Categories</button></li>
          ${Products.categories.map(c => `<li><button data-action="pick-cat" data-value="${esc(c.key)}">${esc(c.label)}</button></li>`).join('')}
        </ul>
      </div>
      <button class="btn btn--outline" data-action="clear-filters">Clear Filters</button>
    </aside>`;
}

function syncDrawer() {
  const r = route();
  const cat = r.name === 'products' ? r.arg : '';
  const label = $('#select-label');
  if (label) label.textContent = cat ? Products.label(cat) : 'All Categories';
  document.querySelectorAll('[data-action="pick-cat"]').forEach(b => b.classList.toggle('is-active', b.dataset.value === cat));
}

function setDrawer(open) {
  const d = $('.drawer'), o = $('.overlay');
  if (!d) return;
  d.classList.toggle('is-open', open);
  o.classList.toggle('is-open', open);
  document.body.classList.toggle('no-scroll', open);
  if (!open) $('.select__list').hidden = true;
}

/* =========================================================
   Render
========================================================= */
function render() {
  const r = route();
  if (['account', 'orders'].includes(r.name) && !Auth.session()) {
    sessionStorage.setItem('store:next', '#/' + r.name);
    return go('#/login');
  }
  if (['login', 'register'].includes(r.name) && Auth.session()) return go('#/account');

  let html;
  switch (r.name) {
    case 'home': case 'products': html = pageStore(r); break;
    case 'product': html = ready ? pageProduct(r) : loader(); break;
    case 'categories': html = pageCategories(); break;
    case 'cart': html = ready ? pageCart() : loader(); break;
    case 'wishlist': html = ready ? pageWishlist() : loader(); break;
    case 'login': html = pageLogin(); break;
    case 'register': html = pageRegister(); break;
    case 'account': html = pageAccount(); break;
    case 'orders': html = pageOrders(); break;
    case 'info': html = pageInfo(r); break;
    default: html = notFound();
  }
  $('#app').innerHTML = html;
  if (r.name === 'home' || r.name === 'products') fillGrid();
  Header.setActive(r.name);
  syncDrawer();
}

function syncWish() {
  document.querySelectorAll('.card__wish').forEach(b => {
    const on = Wishlist.has(b.dataset.id);
    b.classList.toggle('is-active', on);
    b.firstElementChild.className = on ? 'ri-heart-fill' : 'ri-heart-line';
  });
}

/* =========================================================
   Buyurtma berish
========================================================= */
function checkout() {
  if (!Auth.session()) {
    sessionStorage.setItem('store:next', '#/cart');
    toast('Please log in to place your order', 'error');
    return go('#/login');
  }
  const sel = Cart.detailed().filter(i => i.selected);
  if (!sel.length) return toast('Select at least one product', 'error');
  Orders.add({
    id: '#' + Date.now().toString().slice(-8),
    email: Auth.session().email,
    date: new Date().toISOString(),
    total: Cart.total(),
    items: sel.map(i => ({ id: i.id, title: i.product.title, image: i.product.image, price: i.product.price, qty: i.qty }))
  });
  Cart.removeSelected();
  toast('Order placed successfully!');
  go('#/orders');
}

/* =========================================================
   Hodisalar (event delegation)
========================================================= */
document.addEventListener('click', e => {
  if (!e.target.closest('.select')) { const l = $('.select__list'); if (l) l.hidden = true; }

  const el = e.target.closest('[data-action]');
  if (!el) return;
  const a = el.dataset.action;
  const id = Number(el.dataset.id);

  switch (a) {
    case 'wish': {
      e.preventDefault();
      toast(Wishlist.toggle(id) ? 'Added to wishlist' : 'Removed from wishlist');
      break;
    }
    case 'add': Cart.add(id); toast('Added to cart'); break;
    case 'view': go('#/product/' + id); break;
    case 'buy-now': Cart.add(id); go('#/cart'); break;
    case 'inc': Cart.setQty(id, (Cart.get(id) || { qty: 0 }).qty + 1); break;
    case 'dec': Cart.setQty(id, (Cart.get(id) || { qty: 2 }).qty - 1); break;
    case 'remove': Cart.remove(id); toast('Removed from cart'); break;
    case 'select': Cart.toggle(id); break;
    case 'select-all': Cart.selectAll(el.checked); break;
    case 'remove-selected': Cart.removeSelected(); toast('Selected items removed'); break;
    case 'checkout': checkout(); break;
    case 'wish-add-all': Wishlist.items().forEach(p => Cart.add(p.id)); toast('All items added to cart'); break;
    case 'wish-clear': Wishlist.clear(); break;
    case 'logout': Auth.logout(); toast('Logged out'); go('#/'); break;
    case 'burger': $('#header .nav').classList.toggle('is-open'); break;

    case 'open-filter': setDrawer(true); break;
    case 'close-filter': setDrawer(false); break;
    case 'toggle-select': { const l = $('.select__list'); l.hidden = !l.hidden; break; }
    case 'pick-cat': {
      $('.select__list').hidden = true;
      go(el.dataset.value ? '#/products/' + encodeURIComponent(el.dataset.value) : '#/products');
      break;
    }
    case 'clear-filters': {
      state.q = '';
      $('.select__list') && ($('.select__list').hidden = true);
      go('#/products');
      break;
    }
  }
});

document.addEventListener('input', e => {
  if (e.target.id === 'search') { state.q = e.target.value; fillGrid(); }
});

// Rasm yuklanmasa — o'rniga placeholder (error hodisasi bubble bo'lmaydi, shuning uchun capture)
document.addEventListener('error', e => { if (e.target.tagName === 'IMG') imgFallback(e.target); }, true);

document.addEventListener('keydown', e => { if (e.key === 'Escape') setDrawer(false); });

document.addEventListener('submit', e => {
  const f = e.target.closest('[data-form]');
  if (!f) return;
  e.preventDefault();
  const d = Object.fromEntries(new FormData(f));
  const err = $('.form__error', f);
  const fail = msg => { err.textContent = msg; err.hidden = false; };
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((d.email || '').trim());
  let res;

  if (f.dataset.form === 'login') {
    if (!emailOk) return fail('Please enter a valid email address.');
    if (!d.password) return fail('Please enter your password.');
    res = Auth.login(d.email, d.password);
  } else {
    if (!(d.name || '').trim()) return fail('Please enter your full name.');
    if (!emailOk) return fail('Please enter a valid email address.');
    if ((d.password || '').length < 6) return fail('Password must be at least 6 characters.');
    if (d.password !== d.confirm) return fail('Passwords do not match.');
    res = Auth.register(d);
  }
  if (!res.ok) return fail(res.error);

  toast(f.dataset.form === 'login' ? 'Welcome back!' : 'Account created!');
  const next = sessionStorage.getItem('store:next') || '#/';
  sessionStorage.removeItem('store:next');
  go(next);
});

document.addEventListener('store:change', () => {
  Header.update();
  const n = route().name;
  if (['cart', 'wishlist', 'product'].includes(n)) render(); else syncWish();
});

window.addEventListener('hashchange', () => { window.scrollTo(0, 0); render(); });

/* =========================================================
   Ishga tushirish
========================================================= */
function boot() {
  Header.init(() => Auth.session());
  Footer.init();
  renderDrawer();
  render();
  Products.load().then(() => {
    ready = true;
    Header.update();
    render();
  });
}
boot();
