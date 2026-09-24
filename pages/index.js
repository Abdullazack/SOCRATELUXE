import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useCart } from '../lib/CartContext';
import CartDrawer from '../components/CartDrawer';
import Lightbox from '../components/Lightbox';
import SocialPanel from '../components/SocialPanel';

const colors = ['#b08d57', '#3a3a38', '#7c8471', '#9c4f4f', '#5a6e78', '#c2a66b', '#4b4238', '#8a7a68'];

const formatRwf = (amount) => `${Number(amount).toLocaleString('en-US')} Rwf`;

export default function Home() {
  const [products, setProducts] = useState([]);
  const [imagesByProduct, setImagesByProduct] = useState({});
  const [filter, setFilter] = useState('all');
  const [cartOpen, setCartOpen] = useState(false);
  const [lightboxProduct, setLightboxProduct] = useState(null);
  const { cart, add } = useCart();

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .then(({ data, error }) => {
        if (!error && data) setProducts(data);
      });

    supabase
      .from('product_images')
      .select('*')
      .order('position')
      .then(({ data, error }) => {
        if (!error && data) {
          const grouped = {};
          data.forEach((img) => {
            if (!grouped[img.product_id]) grouped[img.product_id] = [];
            grouped[img.product_id].push(img.url);
          });
          setImagesByProduct(grouped);
        }
      });
  }, []);

  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const visible = products.filter((p) => filter === 'all' || p.category === filter);

  const priceFor = (p) => {
    const discount = p.discount_percent || 0;
    if (!discount) return { final: p.price, original: null };
    const final = p.price * (1 - discount / 100);
    return { final, original: p.price };
  };

  return (
    <>
      <header>
        <h1>SOCRATE<span>LUXE</span></h1>
        <button className="cart-btn" onClick={() => setCartOpen(true)}>Cart ({count})</button>
      </header>

      <div className="tabs">
        {['all', 'clothes', 'shoes', 'gents-accessories', 'ladies-accessories'].map((f) => (
          <div key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all'
              ? 'All'
              : f.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')}
          </div>
        ))}
      </div>

      <div className="grid">
        {visible.map((p, i) => {
          const images = imagesByProduct[p.id] || (p.image_url ? [p.image_url] : []);
          const { final, original } = priceFor(p);
          return (
            <div className="card" key={p.id}>
              {images.length > 0 ? (
                <img
                  src={images[0]}
                  alt={p.name}
                  className="card-image"
                  onClick={() => setLightboxProduct({ ...p, images })}
                  style={{ width: '100%', height: 220, objectFit: 'cover', cursor: 'zoom-in' }}
                />
              ) : (
                <div
                  className="swatch"
                  style={{ background: colors[i % colors.length], cursor: 'default' }}
                >
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
              </div>
            </div>
          );
        })}
        {products.length === 0 && (
          <p className="empty">No products yet — add some in Supabase.</p>
        )}
      </div>

      <footer>Socrateluxe — live catalog from Supabase</footer>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} products={products} />
        
      <Lightbox product={lightboxProduct} onClose={() => setLightboxProduct(null)} />
          <SocialPanel />
    </>
  );
}