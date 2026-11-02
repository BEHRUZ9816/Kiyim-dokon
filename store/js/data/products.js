/* data/products.js — mahsulotlar (fakestoreapi.com) + umumiy yordamchi funksiyalar */
const API = 'https://fakestoreapi.com/products';
const CACHE_KEY = 'store:products';
const IMG = 'https://fakestoreapi.com/img/';
const PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#e2e8f0"/><text x="200" y="210" font-family="sans-serif" font-size="22" fill="#94a3b8" text-anchor="middle">No image</text></svg>');

/* ---------- Umumiy yordamchilar ---------- */
const util = {
  esc: s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
  money: n => '$' + Number(n).toFixed(2),
  read(key, fallback) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v === null || v === undefined ? fallback : v; }
    catch (e) { return fallback; }
  },
  write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ } },
  emit(type) { document.dispatchEvent(new CustomEvent('store:change', { detail: { type } })); },
  imgFallback(img) { img.onerror = null; img.src = PLACEHOLDER; }
};
export const { esc, money, read, write, emit, imgFallback } = util;

/* ---------- Kategoriyalar ---------- */
const CATEGORIES = [
  { key: 'electronics', label: 'Electronics', title: 'Electronics' },
  { key: 'jewelery', label: 'Jewelery', title: 'Jewelery' },
  { key: "men's clothing", label: "Men's clothing", title: "Men's Clothing" },
  { key: "women's clothing", label: "Women's clothing", title: "Women's Clothing" }
];

/* ---------- Zaxira (API ishlamasa) ---------- */
const rows = [
  [1, 'Fjallraven - Foldsack No. 1 Backpack, Fits 15 Laptops', 109.95, "men's clothing", 'Your perfect pack for everyday use and walks in the forest. Stash your laptop (up to 15 inches) in the padded sleeve, your everyday', '81fPKd-2AYL._AC_SL1500_.jpg', 3.9, 120],
  [2, 'Mens Casual Premium Slim Fit T-Shirts', 22.3, "men's clothing", 'Slim-fitting style, contrast raglan long sleeve, three-button henley placket, light weight & soft fabric for breathable and comfortable wearing.', '71-3HjGNDUL._AC_SY879._SX._UX._SY._UY_.jpg', 4.1, 259],
  [3, 'Mens Cotton Jacket', 55.99, "men's clothing", 'Great outerwear jackets for Spring/Autumn/Winter, suitable for many occasions, such as working, hiking, camping, mountain/rock climbing, cycling, traveling or other outdoors.', '71li-ujtlUL._AC_UX679_.jpg', 4.7, 500],
  [4, 'Mens Casual Slim Fit', 15.99, "men's clothing", 'The color could be slightly different between on the screen and in practice. Please note that body builds vary by person, therefore, detailed size information should be reviewed below on the product description.', '71YXzeOuslL._AC_UY879_.jpg', 2.1, 430],
  [5, "John Hardy Women's Legends Naga Gold & Silver Dragon Station Chain Bracelet", 695, 'jewelery', "From our Legends Collection, the Naga was inspired by the mythical water dragon that protects the ocean's pearl. Wear facing inward to be bestowed with love and abundance.", '71pWzhdJNwL._AC_UL640_QL65_ML3_.jpg', 4.6, 400],
  [6, 'Solid Gold Petite Micropave', 168, 'jewelery', 'Satisfaction Guaranteed. Return or exchange any order within 30 days. Designed and sold by Hafeez Center in the United States.', '61sbMiUnoGL._AC_UL640_QL65_ML3_.jpg', 3.9, 70],
  [7, 'White Gold Plated Princess', 9.99, 'jewelery', "Classic Created Wedding Engagement Solitaire Diamond Promise Ring for Her. Gifts to spoil your love more for Engagement, Wedding, Anniversary, Valentine's Day.", '71YAIFU48IL._AC_UL640_QL65_ML3_.jpg', 3, 400],
  [8, 'Pierced Owl Rose Gold Plated Stainless Steel Double', 10.99, 'jewelery', 'Rose Gold Plated Double Flared Tunnel Plug Earrings. Made of 316L Stainless Steel.', '51UDEzMJVpL._AC_UL640_QL65_ML3_.jpg', 1.9, 100],
  [9, 'WD 2TB Elements Portable External Hard Drive - USB 3.0', 64, 'electronics', 'USB 3.0 and USB 2.0 Compatibility. Fast data transfers. Improve PC Performance. High Capacity. Compatibility: Formatted NTFS for Windows 10, Windows 8.1, Windows 7.', '61IBBVJvSDL._AC_SY879_.jpg', 3.3, 203],
  [10, 'SanDisk SSD PLUS 1TB Internal SSD - SATA III 6 Gb/s', 109, 'electronics', 'Easy upgrade for faster boot up, shutdown, application load and response. Boosts burst write performance, making it ideal for typical PC workloads.', '61U7T1koQqL._AC_SX679_.jpg', 2.9, 470],
  [11, 'Silicon Power 256GB SSD 3D NAND A55 SLC Cache Performance Boost SATA III 2.5', 109, 'electronics', '3D NAND flash are applied to deliver high transfer speeds. Remarkable transfer speeds that enable faster bootup and improved overall system performance.', '71kWymZ+c+L._AC_SX679_.jpg', 4.8, 319],
  [12, 'WD 4TB Gaming Drive Works with Playstation 4 Portable External Hard Drive', 114, 'electronics', 'Expand your PS4 gaming experience, Play anywhere. Fast and easy, setup. Sleek design with high capacity, 3-year manufacturer limited warranty.', '61mtL65D4cL._AC_SX679_.jpg', 4.8, 400],
  [13, 'Acer SB220Q bi 21.5 inches Full HD (1920 x 1080) IPS Ultra-Thin', 599, 'electronics', '21.5 inches Full HD (1920 x 1080) widescreen IPS display. Radeon free Sync technology. Zero-frame design, ultra-thin, 4ms response time.', '81QpkIctqPL._AC_SX679_.jpg', 2.9, 250],
  [14, 'Samsung 49-Inch CHG90 144Hz Curved Gaming Monitor (LC49HG90DMNXZA) - Super Ultrawide Screen QLED', 999.99, 'electronics', '49 INCH SUPER ULTRAWIDE 32:9 CURVED GAMING MONITOR with dual 27 inch screen side by side. QUANTUM DOT (QLED) TECHNOLOGY, HDR support and factory calibration.', '81Zt42ioCgL._AC_SX679_.jpg', 2.2, 140],
  [15, "BIYLACLESEN Women's 3-in-1 Snowboard Jacket Winter Coats", 56.99, "women's clothing", 'Note: The Jackets is US standard size, Please choose size as your usual wear. Material: 100% Polyester; Detachable Liner Fabric: Warm Fleece.', '51Y5NI-I5jL._AC_UX679_.jpg', 2.6, 235],
  [16, "Lock and Love Women's Removable Hooded Faux Leather Moto Biker Jacket", 29.95, "women's clothing", '100% POLYURETHANE (shell) 100% POLYESTER (lining) 75% POLYESTER 25% COTTON (SWEATER), Faux leather material for style and comfort.', '81XH0e8fefL._AC_UY879_.jpg', 2.9, 340],
  [17, 'Rain Jacket Women Windbreaker Striped Climbing Raincoats', 39.99, "women's clothing", 'Lightweight perfet for trip or casual wear---Long sleeve with hooded, adjustable drawstring waist design. Button and zipper front closure raincoat.', '71HblAHs5xL._AC_UY879_-2.jpg', 3.8, 679],
  [18, "MBJ Women's Solid Short Sleeve Boat Neck V", 9.85, "women's clothing", '95% RAYON 5% SPANDEX, Made in USA or Imported, Do Not Bleach, Lightweight fabric with great stretch for comfort, Ribbed on sleeves and neckline.', '71z3kpMAYsL._AC_UY879_.jpg', 4.7, 130],
  [19, "Opna Women's Short Sleeve Moisture", 7.95, "women's clothing", '100% Polyester, Machine wash, 100% cationic polyester interlock, Machine Wash & Pre Shrunk for a Great Fit, Lightweight, roomy and highly breathable.', '51eg55uWmdL._AC_UX679_.jpg', 4.5, 146],
  [20, 'DANVOUY Womens T Shirt Casual Cotton Short', 12.99, "women's clothing", '95%Cotton,5%Spandex, Features: Casual, Short Sleeve, Letter Print,V-Neck,Fashion Tees, The fabric is soft and has some stretch.', '61pHAEJ4NML._AC_UX679_.jpg', 3.6, 145]
];
const fallback = rows.map(r => ({
  id: r[0], title: r[1], price: r[2], category: r[3], description: r[4],
  image: IMG + r[5], rating: { rate: r[6], count: r[7] }
}));

/* ---------- Mahsulotlar bilan ishlash ---------- */
let list = [];

export const Products = {
  async load() {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 7000);
      const res = await fetch(API, { signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (!Array.isArray(data) || !data.length) throw new Error('Empty');
      list = data;
      util.write(CACHE_KEY, data);
    } catch (e) {
      list = util.read(CACHE_KEY, null) || fallback;
    }
    return list;
  },
  all: () => list,
  get: id => list.find(p => p.id === Number(id)),
  categories: CATEGORIES,
  label(key) { const c = CATEGORIES.find(c => c.key === key); return c ? c.label : key; },
  title(key) { const c = CATEGORIES.find(c => c.key === key); return c ? c.title : key; },
  filter({ q, category } = {}) {
    const s = (q || '').trim().toLowerCase();
    return list.filter(p =>
      (!category || p.category === category) &&
      (!s || p.title.toLowerCase().includes(s) || p.description.toLowerCase().includes(s))
    );
  },
  related(p, n = 4) { return list.filter(x => x.category === p.category && x.id !== p.id).slice(0, n); }
};
