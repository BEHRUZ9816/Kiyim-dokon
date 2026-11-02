/* store/wishlist.js — saralanganlar (localStorage'da saqlanadi) */
import { read, write, emit, Products } from '../data/products.js';
const KEY = 'store:wishlist';
let ids = read(KEY, []);

const save = () => { write(KEY, ids); emit('wishlist'); };

export const Wishlist = {
  has: id => ids.includes(Number(id)),
  count: () => ids.length,
  items: () => ids.map(id => Products.get(id)).filter(Boolean),
  /** true — qo'shildi, false — olib tashlandi */
  toggle(id) {
    id = Number(id);
    const on = !ids.includes(id);
    ids = on ? [id, ...ids] : ids.filter(x => x !== id);
    save();
    return on;
  },
  clear() { ids = []; save(); }
};
