import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useCart } from '../lib/CartContext';
import CartDrawer from '../components/CartDrawer';

const colors = ['#b08d57', '#3a3a38', '#7c8471', '#9c4f4f', '#5a6e78', '#c2a66b', '#4b4238', '#8a7a68'];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [cartOpen, setCartOpen] = useState(false);
  const { cart, add } = useCart();

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .then(({ data, error }) => {
        if (!error && data) setProducts(data);
      });
  }, []);

  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const visible = products.filter((p) => filter === 'all' || p.category === filter);

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
        {visible.map((p, i) => (
          <div className="card" key={p.id}>
            <div className="swatch" style={{ background: colors[i % colors.length] }}>
              {p.category.split('-').map((w) => w.toUpperCase()).join(' ')}
            </div>
            <div className="info">
              <p className="name">{p.name}</p>
              <p className="price">${p.price}</p>
              <button className="add" onClick={() => add(p)}>Add to cart</button>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <p className="empty">No products yet — add some in Supabase.</p>
        )}
      </div>

      <footer>Socrateluxe — live catalog from Supabase</footer>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} products={products} />
    </>
  );
}
