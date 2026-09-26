import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useCart } from '../lib/CartContext';
import CartDrawer from '../components/CartDrawer';
import Lightbox from '../components/Lightbox';
import SocialPanel from '../components/SocialPanel';

const colors = ['#b08d57', '#3a3a38', '#7c8471', '#9c4f4f', '#5a6e78', '#c2a66b', '#4b4238', '#8a7a68'];
const formatRwf = (amount) => `${Number(amount).toLocaleString('en-US')} Rwf`;

const SOCIALS = [
  { key: 'facebook', label: 'FB', color: '#1877F2' },
  { key: 'instagram', label: 'IG', color: '#E1306C' },
  { key: 'whatsapp', label: 'WA', color: '#25D366' },
  { key: 'tiktok', label: 'TT', color: '#000' },
  { key: 'twitter', label: 'X', color: '#000' },
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [imagesByProduct, setImagesByProduct] = useState({});
  const [filter, setFilter] = useState('all');
  const [cartOpen, setCartOpen] = useState(false);
  const [lightboxProduct, setLightboxProduct] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);
  const [social, setSocial] = useState({});
  const [showAllTrending, setShowAllTrending] = useState(false);
  const { cart, add } = useCart();
    const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isComparing, toggleCompare, compareIds } = useCompare();
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  useEffect(() => {
    supabase.from('products').select('*').eq('active', true).then(({ data, error }) => {
      if (!error && data) setProducts(data);
    });

    supabase.from('product_images').select('*').order('position').then(({ data, error }) => {
      if (!error && data) {
        const grouped = {};
        data.forEach((img) => {
          if (!grouped[img.product_id]) grouped[img.product_id] = [];
          grouped[img.product_id].push(img.url);
        });
        setImagesByProduct(grouped);
      }
    });

    supabase.from('settings').select('*').eq('key', 'branding').single().then(({ data, error }) => {
      if (!error && data) setLogoUrl(data.value.logo_url);
    });

    supabase.from('settings').select('*').eq('key', 'social_links').single().then(({ data, error }) => {
      if (!error && data) setSocial(data.value || {});
    });
  }, []);

  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const visible = products.filter((p) => filter === 'all' || p.category === filter);
  const trending = products.filter((p) => p.trending);
  const trendingShown = showAllTrending ? trending : trending.slice(0, 4);

  const priceFor = (p) => {
    const discount = p.discount_percent || 0;
    if (!discount) return { final: p.price, original: null };
    return { final: p.price * (1 - discount / 100), original: p.price };
  };

  const goHome = (e) => {
    e.preventDefault();
    setFilter('all');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const ProductCard = ({ p, i }) => {
    const images = imagesByProduct[p.id] || (p.image_url ? [p.image_url] : []);
    const { final, original } = priceFor(p);
    const favorited = isFavorite(p.id);
    const comparing = isComparing(p.id);

    const buyNow = () => {
      add(p);
      router.push('/checkout');
    };

    return (
      <div className={`card ${comparing ? 'comparing' : ''}`}>
        <div className="card-hover-icons">
          <button
            className={`icon-btn ${favorited ? 'favorited' : ''}`}
            onClick={() => toggleFavorite(p.id)}
            title="Add to favorites"
          >
            {favorited ? '♥' : '♡'}
          </button>
          <button className="icon-btn" onClick={() => setQuickViewProduct({ ...p, images })} title="Quick view">
            👁
          </button>
        </div>

        {images.length > 0 ? (
          <img
            src={images[0]} alt={p.name} className="card-image"
            onClick={() => setLightboxProduct({ ...p, images })}
            style={{ width: '100%', height: 220, objectFit: 'cover', cursor: 'zoom-in' }}
          />
        ) : (
          <div className="swatch" style={{ background: colors[i % colors.length] }}>
            {p.category.split('-').map((w) => w.toUpperCase()).join(' ')}
          </div>
        )}
        {p.trending && <span className="badge">Trending</span>}
        <div className="info">
          <p className="name">{p.name}</p>
          <p className="price">
            {formatRwf(final)}
            {original && (
              <span style={{ textDecoration: 'line-through', opacity: 0.5, marginLeft: 8, fontSize: '0.85em' }}>
                {formatRwf(original)}
              </span>
            )}
          </p>
          <button className="add" onClick={() => add(p)}>Add to cart</button>
          <button className="buy-now" onClick={buyNow}>Buy now</button>
          <label className="compare-row">
            <input type="checkbox" checked={comparing} onChange={() => toggleCompare(p.id)} />
            Compare
          </label>
        </div>
      </div>
    );
  };

  return (
    <>
      <header>
        <a href="/" onClick={goHome} className="logo-link">
          {logoUrl && <img src={logoUrl} alt="Socrateluxe" className="logo-img" />}
          <h1>SOCRATE<span>LUXE</span></h1>
        </a>
        <div className="header-actions">
          <a href="/admin/login" className="admin-btn">Sign in</a>
          <button className="cart-btn" onClick={() => setCartOpen(true)}>Cart ({count})</button>
        </div>
      </header>

      <div className="tabs">
        {['all', 'clothes', 'shoes', 'gents-accessories', 'ladies-accessories'].map((f) => (
          <div key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')}
          </div>
        ))}
      </div>

      {trending.length > 0 && (
        <section style={{ padding: '20px 20px 0', maxWidth: 960, margin: '0 auto' }}>
          <h2 style={{ fontSize: 18, margin: '0 0 12px', color: '#152D35' }}>🔥 Trending Now</h2>
          <div className="grid" style={{ padding: 0 }}>
            {trendingShown.map((p, i) => <ProductCard key={p.id} p={p} i={i} />)}
          </div>
          {trending.length > 4 && (
            <div style={{ textAlign: 'center', margin: '16px 0' }}>
              <button
                onClick={() => setShowAllTrending((s) => !s)}
                style={{
                  background: '#152D35', color: '#F3FF74', border: 'none', padding: '9px 22px',
                  borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                {showAllTrending ? 'Show less' : `Show more (${trending.length - 4})`}
              </button>
            </div>
          )}
          <hr style={{ border: 'none', borderTop: '1px solid #c3ddd3', margin: '24px 0 0' }} />
        </section>
      )}

      <div className="grid">
        {visible.map((p, i) => <ProductCard key={p.id} p={p} i={i} />)}
        {products.length === 0 && <p className="empty">No products yet — add some in Supabase.</p>}
      </div>

      <footer className="site-footer">
        <div className="footer-top">
          <div className="footer-col">
            <h4>Information</h4>
            <a href="#">Special Offers</a>
            <a href="#">Gift Ideas</a>
            <a href="#">Delivery Info</a>
          </div>
          <div className="footer-col">
            <h4>Shop</h4>
            <a href="#" onClick={(e) => { e.preventDefault(); setFilter('clothes'); }}>Clothes</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setFilter('shoes'); }}>Shoes</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setFilter('gents-accessories'); }}>Gents Accessories</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setFilter('ladies-accessories'); }}>Ladies Accessories</a>
          </div>
          <div className="footer-col">
            <h4>Support</h4>
            <a href="#">Track your Order</a>
            <a href="#">Customer Service</a>
            <a href="#">FAQ</a>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <a href="#">About Us</a>
            <a href="#">Contact Us</a>
            <a href="/admin/login">Admin</a>
          </div>
        </div>

        <div className="footer-mid">
          <div className="payment-badges">
            <span className="pay-badge" style={{ background: '#FFCB05', color: '#152D35' }}>MoMo</span>
            <span className="pay-badge" style={{ background: '#25D366' }}>Airtel</span>
            <span className="pay-badge" style={{ background: '#152D35' }}>Bank</span>
            <span className="pay-badge" style={{ background: '#1a1f71' }}>Visa</span>
            <span className="pay-badge" style={{ background: '#eb001b' }}>Mastercard</span>
          </div>
          <div className="social-badges">
            {SOCIALS.filter((s) => social[s.key]).map((s) => (
              <a key={s.key} href={social[s.key]} target="_blank" rel="noopener noreferrer"
                className="social-badge" style={{ background: s.color }}>
                {s.label}
              </a>
            ))}
          </div>
        </div>

        <div className="footer-bottom">
          © {new Date().getFullYear()} Socrateluxe — All rights reserved
        </div>
      </footer>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} products={products} />
      <Lightbox product={lightboxProduct} onClose={() => setLightboxProduct(null)} />
      <SocialPanel />
    </>
  );
}