import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { useCart } from '../lib/CartContext';

export default function Checkout() {
  const { cart, clear } = useCart();
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [step, setStep] = useState('details');
  const [buyer, setBuyer] = useState({ name: '', phone: '', address: '' });
  const [payMethod, setPayMethod] = useState('momo');
  const [orderId, setOrderId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.from('products').select('*').then(({ data }) => setProducts(data || []));
  }, []);

  const lines = Object.keys(cart).map((id) => {
    const p = products.find((p) => String(p.id) === id);
    return p ? { ...p, qty: cart[id], lineTotal: p.price * cart[id] } : null;
  }).filter(Boolean);
  const total = lines.reduce((s, l) => s + l.lineTotal, 0);

  if (lines.length === 0 && step !== 'confirm') {
    return (
      <div className="page">
        <p className="empty">Your cart is empty.</p>
        <button className="place-order" onClick={() => router.push('/')}>Back to shop</button>
      </div>
    );
  }

  const submitOrder = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyer,
          paymentMethod: payMethod,
          lines: lines.map((l) => ({ id: l.id, name: l.name, price: l.price, qty: l.qty })),
          total,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Order failed');
      setOrderId(data.orderId);
      clear();
      setStep('confirm');
    } catch (err) {
      alert('Could not place order: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      {step === 'details' && (
        <>
          <h2>Delivery details</h2>
          <label>Full name</label>
          <input value={buyer.name} onChange={(e) => setBuyer({ ...buyer, name: e.target.value })} />
          <label>Phone number</label>
          <input value={buyer.phone} onChange={(e) => setBuyer({ ...buyer, phone: e.target.value })} />
          <label>Delivery address</label>
          <input value={buyer.address} onChange={(e) => setBuyer({ ...buyer, address: e.target.value })} />
          <button
            className="place-order"
            onClick={() => {
              if (!buyer.name || !buyer.phone || !buyer.address) { alert('Please fill in all fields.'); return; }
              setStep('review');
            }}
          >
            Continue to review
          </button>
          <button className="back-link" onClick={() => router.push('/')}>Cancel</button>
        </>
      )}

      {step === 'review' && (
        <>
          <h2>Review order</h2>
          {lines.map((l) => (
            <div className="summary-row" key={l.id}><span>{l.name} x{l.qty}</span><span>${l.lineTotal}</span></div>
          ))}
          <div className="summary-total"><span>Total</span><span>${total}</span></div>
          <label style={{ marginTop: 16 }}>Deliver to</label>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
            {buyer.name} · {buyer.phone}<br />{buyer.address}
          </div>
          <button className="place-order" onClick={() => setStep('payment')}>Continue to payment</button>
          <button className="back-link" onClick={() => setStep('details')}>Back</button>
        </>
      )}

      {step === 'payment' && (
        <>
          <h2>Payment method</h2>
          <div className="pay-opts">
            {[
              { id: 'momo', label: 'MoMo (Mobile Money)' },
              { id: 'airtel', label: 'Airtel Money' },
              { id: 'bank', label: 'Bank transfer' },
            ].map((opt) => (
              <label className="pay-opt" key={opt.id}>
                <input
                  type="radio"
                  name="pay"
                  checked={payMethod === opt.id}
                  onChange={() => setPayMethod(opt.id)}
                />
                {opt.label}
              </label>
            ))}
          </div>
          <div className="summary-total" style={{ marginTop: 16 }}>
            <span>Total to pay</span><span>${total}</span>
          </div>
          <button className="place-order" onClick={submitOrder} disabled={submitting}>
            {submitting ? 'Placing order…' : 'Place order'}
          </button>
          <button className="back-link" onClick={() => setStep('review')}>Back</button>
        </>
      )}

      {step === 'confirm' && (
        <div className="confirm">
          <div className="tick">✓</div>
          <h2>Order placed</h2>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>
            Order <strong>#{orderId}</strong><br />
            We&apos;ll contact {buyer.phone} to confirm payment.
          </p>
          <button className="place-order" onClick={() => router.push('/')}>Back to shop</button>
        </div>
      )}
    </div>
  );
}
