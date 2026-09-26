import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import AdminNav from '../../components/AdminNav';

const statusColor = (status) => ({
  pending: '#b45309', confirmed: '#152D35', shipped: '#244a52', delivered: '#2f7a4d', cancelled: '#c0392b',
}[status] || '#5b6f6a');

export default function AdminDashboardHome() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace('/admin/login');
      else setSession(data.session);
      setChecking(false);
    });
  }, [router]);

  useEffect(() => {
    if (!session) return;
    supabase.from('orders').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setOrders(data);
      setLoading(false);
    });
  }, [session]);

  if (checking) return <p style={{ padding: 24 }}>Checking session…</p>;
  if (!session) return null;

  const validOrders = orders.filter((o) => o.status !== 'cancelled');
  const totalRevenue = validOrders.reduce((s, o) => s + Number(o.total || 0), 0);
  const pendingCount = orders.filter((o) => o.status === 'pending' || !o.status).length;
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;

  const now = new Date();
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (13 - i));
    return d;
  });
  const dailyTotals = days.map((day) => {
    const dayStr = day.toDateString();
    return validOrders
      .filter((o) => new Date(o.created_at).toDateString() === dayStr)
      .reduce((s, o) => s + Number(o.total || 0), 0);
  });
  const maxDaily = Math.max(...dailyTotals, 1);
  const chartW = 640, chartH = 140;
  const points = dailyTotals.map((val, i) => {
    const x = (i / (dailyTotals.length - 1)) * chartW;
    const y = chartH - (val / maxDaily) * (chartH - 20) - 5;
    return `${x},${y}`;
  }).join(' ');

  const recentOrders = orders.slice(0, 6);

  const statCardStyle = { background: '#fff', border: '1px solid #e0dcd4', borderRadius: 12, padding: '16px 18px', flex: '1 1 160px' };

  return (
    <div style={{ minHeight: '100vh', background: '#D4ECDD' }}>
      <AdminNav active="dashboard" />

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
        <h2 style={{ marginTop: 0, color: '#152D35' }}>Dashboard</h2>

        {loading ? <p>Loading…</p> : (
          <>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
              <div style={statCardStyle}>
                <p style={{ margin: 0, fontSize: 12, color: '#5b6f6a' }}>Total Revenue</p>
                <p style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 700, color: '#152D35' }}>
                  {totalRevenue.toLocaleString()} Rwf
                </p>
              </div>
              <div style={statCardStyle}>
                <p style={{ margin: 0, fontSize: 12, color: '#5b6f6a' }}>Total Orders</p>
                <p style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 700, color: '#152D35' }}>{orders.length}</p>
              </div>
              <div style={statCardStyle}>
                <p style={{ margin: 0, fontSize: 12, color: '#5b6f6a' }}>Pending</p>
                <p style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 700, color: '#b45309' }}>{pendingCount}</p>
              </div>
              <div style={statCardStyle}>
                <p style={{ margin: 0, fontSize: 12, color: '#5b6f6a' }}>Delivered</p>
                <p style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 700, color: '#2f7a4d' }}>{deliveredCount}</p>
              </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #e0dcd4', borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <h3 style={{ marginTop: 0, fontSize: 14, color: '#152D35' }}>Revenue — last 14 days</h3>
              <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: '100%', height: 140 }}>
                <polyline points={points} fill="none" stroke="#152D35" strokeWidth="2.5" />
                {dailyTotals.map((val, i) => {
                  const x = (i / (dailyTotals.length - 1)) * chartW;
                  const y = chartH - (val / maxDaily) * (chartH - 20) - 5;
                  return <circle key={i} cx={x} cy={y} r="3" fill="#F3FF74" stroke="#152D35" strokeWidth="1.5" />;
                })}
              </svg>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#5b6f6a', marginTop: 4 }}>
                <span>{days[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                <span>{days[days.length - 1].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #e0dcd4', borderRadius: 12, padding: 20 }}>
              <h3 style={{ marginTop: 0, fontSize: 14, color: '#152D35' }}>Recent Orders</h3>
              {recentOrders.length === 0 ? (
                <p style={{ color: '#5b6f6a', fontSize: 13 }}>No orders yet.</p>
              ) : (
                <div>
                  {recentOrders.map((o) => (
                    <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #eee', flexWrap: 'wrap', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, minWidth: 120 }}>{o.buyer_name}</span>
                      <span style={{ fontSize: 12, color: '#5b6f6a', minWidth: 90 }}>
                        {new Date(o.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, minWidth: 90 }}>{Number(o.total).toLocaleString()} Rwf</span>
                      <span style={{
                        background: statusColor(o.status), color: '#fff', fontSize: 11, fontWeight: 600,
                        padding: '3px 10px', borderRadius: 10, textTransform: 'capitalize',
                      }}>
                        {o.status || 'pending'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}