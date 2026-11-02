/* components/footer.js — sayt pastki qismi */
function init() {
  document.getElementById('footer').innerHTML = `
    <footer class="footer">
      <div class="container">
        <div class="footer__grid">
          <div>
            <h3>Store</h3>
            <p class="footer__text">Your one-stop shop for all your shopping needs. Quality products, competitive prices, and exceptional service.</p>
            <div class="footer__social">
              <a href="https://facebook.com" target="_blank" rel="noopener" aria-label="Facebook"><i class="ri-facebook-line"></i></a>
              <a href="https://instagram.com" target="_blank" rel="noopener" aria-label="Instagram"><i class="ri-instagram-line"></i></a>
              <a href="https://twitter.com" target="_blank" rel="noopener" aria-label="Twitter"><i class="ri-twitter-line"></i></a>
              <a href="https://youtube.com" target="_blank" rel="noopener" aria-label="YouTube"><i class="ri-youtube-line"></i></a>
            </div>
          </div>
          <div>
            <h3>Shop</h3>
            <ul class="footer__links">
              <li><a href="#/products">All Products</a></li>
              <li><a href="#/categories">Categories</a></li>
              <li><a href="#/wishlist">Wishlist</a></li>
              <li><a href="#/cart">Cart</a></li>
            </ul>
          </div>
          <div>
            <h3>Account</h3>
            <ul class="footer__links">
              <li><a href="#/login">Login</a></li>
              <li><a href="#/register">Register</a></li>
              <li><a href="#/account">My Account</a></li>
              <li><a href="#/orders">Order History</a></li>
            </ul>
          </div>
          <div>
            <h3>Contact</h3>
            <ul class="footer__contact">
              <li><i class="ri-map-pin-line"></i> 123 Shopping Street, Retail City, 10001</li>
              <li><i class="ri-phone-line"></i> (123) 456-7890</li>
              <li><i class="ri-mail-line"></i> info@store.com</li>
            </ul>
          </div>
        </div>
        <div class="footer__bottom">
          <p>© ${new Date().getFullYear()} Store. All rights reserved.</p>
          <div class="footer__legal">
            <a href="#/info/privacy">Privacy Policy</a>
            <a href="#/info/terms">Terms of Service</a>
            <a href="#/info/shipping">Shipping Policy</a>
          </div>
        </div>
      </div>
    </footer>`;
}

export const Footer = { init };
