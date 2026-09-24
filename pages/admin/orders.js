import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const statusColor = (status) => ({
  pending: '#b45309', confirmed: '#152D35', shipped: '#244a52', delivered: '#2f7a4d', cancelled: '#c0392b',
}[status] || '#5b6f6a');

export default function AdminOrders() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [orders, setOrders] = useState([]);
  const [itemsByOrder, setItemsByOrder] = useState({});
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace('/admin/login');
      else setSession(data.session);
      setChecking(false);
    });
  }, [router]);

  useEffect(() => {
    if (!session) return;
    load();
  }, [session]);

  const load = async () => {
    setLoading(true);
    const { data: ordersData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    setOrders(ordersData || []);

    const { data: itemsData } = await supabase.from('order_items').select('*');
    if (itemsData) {
      const grouped = {};
      itemsData.forEach((item) => {
        if (!grouped[item.order_id]) grouped[item.order_id] = [];
        grouped[item.order_id].push(item);
      });
      setItemsByOrder(grouped);
    }
    setLoading(false);
  };

  const updateStatus = async (orderId, status) => {
    setUpdatingId(orderId);
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    setUpdatingId(null);
    if (error) { alert('Update failed: ' + error.message); return; }
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
  };

  if (checking) return <p style={{ padding: 24 }}>Checking session…</p>;
  if (!session) return null;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Orders</h1>
        <Link href="/admin">← Back to dashboard</Link>
      </div>

      {loading ? <p>Loading…</p> : orders.length === 0 ? (
        <p style={{ color: '#5b6f6a' }}>No orders yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {orders.map((o) => (
            <div key={o.id} style={{ border: '1px solid #e0dcd4', borderRadius: 10, padding: 16, background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 700 }}>Order #{o.id}</p>
                  <p style={{ margin: '2px 0', fontSize: 13, color: '#5b6f6a' }}>
                    {new Date(o.created_at).toLocaleString()}
                  </p>
                </div>
                <span style={{
                  background: statusColor(o.status), color: '#fff', fontSize: 12, fontWeight: 600,
                  padding: '4px 12px', borderRadius: 12, height: 'fit-content', textTransform: 'capitalize',
                }}>
                  {o.status || 'pending'}
                </span>
              </div>

              <div style={{ marginTop: 10, fontSize: 14 }}>
                <p style={{ margin: '2px 0' }}><strong>{o.buyer_name}</strong> · {o.buyer_phone}</p>
                <p style={{ margin: '2px 0', color: '#5b6f6a' }}>{o.buyer_address}</p>
                <p style={{ margin: '2px 0', color: '#5b6f6a' }}>Payment: {o.payment_method}</p>
              </div>

              <div style={{ marginTop: 10, borderTop: '1px solid #eee', paddingTop: 10 }}>
                {(itemsByOrder[o.id] || []).map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0' }}>
                    <span>{item.name} x{item.qty}</span>
                    <span>{Number(item.line_total).toLocaleString()} Rwf</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginTop: 6, paddingTop: 6, borderTop: '1px solid #eee' }}>
                  <span>Total</span>
                  <span>{Number(o.total).toLocaleString()} Rwf</span>
                </div>
              </div>

              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 12, color: '#5b6f6a' }}>Update status:</label>
                <select
                  value={o.status || 'pending'}
                  disabled={updatingId === o.id}
                  onChange={(e) => updateStatus(o.id, e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #c3ddd3' }}
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {updatingId === o.id && <span style={{ fontSize: 12 }}>Saving…</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}