import { useCart } from '../lib/CartContext';
import { useRouter } from 'next/router';

const formatRwf = (amount) => `${Number(amount).toLocaleString('en-US')} Rwf`;

export default function CartDrawer({ open, onClose, products }) {
  const { cart, remove } = useCart();
  const router = useRouter();

  const priceFor = (p) => {
    const discount = p.discount_percent || 0;
    return discount ? p.price * (1 - discount / 100) : p.price;
  };

  const lines = Object.keys(cart).map((id) => {
    const p = products.find((p) => String(p.id) === id);
    if (!p) return null;
    const unitPrice = priceFor(p);
    return { ...p, qty: cart[id], lineTotal: unitPrice * cart[id] };
  }).filter(Boolean);

  const total = lines.reduce((s, l) => s + l.lineTotal, 0);

  return (
    <>
      <div className={`overlay ${open ? 'show' : ''}`} onClick={onClose} />
      <div id="cartPanel" className={open ? 'open' : ''}>
        <div className="cart-head">
          <strong>Your Cart</strong>
          <button className="close" onClick={onClose}>&times;</button>
        </div>
        <div className="cart-items">
          {lines.length === 0 && <p className="empty">Your cart is empty</p>}
          {lines.map((l) => (
            <div className="cart-row" key={l.id}>
              <span>{l.name} x{l.qty}</span>
              <span>
                {formatRwf(l.lineTotal)}{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); remove(l.id); }} style={{ color: 'var(--muted)', marginLeft: 8 }}>✕</a>
              </span>
            </div>
          ))}
        </div>
        <div className="cart-foot">
          <div className="total"><span>Total</span><span>{formatRwf(total)}</span></div>
          <button
            className="checkout-btn"
            onClick={() => {
              if (lines.length === 0) { alert('Your cart is empty — add something first.'); return; }
              onClose();
              router.push('/checkout');
            }}
          >
            Checkout
          </button>
        </div>
      </div>
    </>
  );
}