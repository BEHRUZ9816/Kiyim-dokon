/* store/cart.js — savatcha (localStorage'da saqlanadi) */
import { read, write, emit, Products } from '../data/products.js';
const KEY = 'store:cart';
let items = read(KEY, []);

const save = () => { write(KEY, items); emit('cart'); };
const find = id => items.find(i => i.id === Number(id));

export const Cart = {
  /** Mahsulot ma'lumoti bilan birga */
  detailed() {
    return items
      .map(i => ({ ...i, product: Products.get(i.id) }))
      .filter(i => i.product);
  },
  get: id => find(id),
  has: id => !!find(id),
  count: () => items.reduce((s, i) => s + i.qty, 0),
  add(id, qty = 1) {
    const it = find(id);
    if (it) { it.qty = Math.min(99, it.qty + qty); it.selected = true; }
    else items.push({ id: Number(id), qty, selected: true });
    save();
  },
  setQty(id, qty) {
    const it = find(id);
    if (!it) return;
    if (qty < 1) return this.remove(id);
    it.qty = Math.min(99, qty);
    save();
  },
  remove(id) { items = items.filter(i => i.id !== Number(id)); save(); },
  toggle(id) { const it = find(id); if (it) { it.selected = !it.selected; save(); } },
  selectAll(value) { items.forEach(i => { i.selected = !!value; }); save(); },
  removeSelected() { items = items.filter(i => !i.selected); save(); },
  /** Tanlangan mahsulotlar summasi */
  total() {
    return this.detailed().filter(i => i.selected).reduce((s, i) => s + i.product.price * i.qty, 0);
  },
  clear() { items = []; save(); }
};
