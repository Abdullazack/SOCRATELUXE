import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function AdminNav({ active }) {
  const router = useRouter();
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  const navBtn = (key, href, label) => (
    <Link
      href={href}
      style={{
        background: active === key ? '#F3FF74' : 'rgba(255,255,255,0.12)',
        color: active === key ? '#152D35' : '#fff',
        border: active === key ? 'none' : '1px solid rgba(255,255,255,0.3)',
        padding: '8px 16px', borderRadius: 18, fontSize: 13, textDecoration: 'none',
        fontWeight: active === key ? 700 : 400,
      }}
    >
      {label}
    </Link>
  );

  return (
    <div style={{ background: '#152D35', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
      <h1 style={{ color: '#fff', margin: 0, fontSize: 18, letterSpacing: 1 }}>
        SOCRATELUXE <span style={{ color: '#F3FF74', fontWeight: 400, fontSize: 13 }}>· Admin</span>
      </h1>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {navBtn('dashboard', '/admin', 'Dashboard')}
        {navBtn('products', '/admin/products', 'Products')}
        {navBtn('orders', '/admin/orders', 'Orders')}
        {navBtn('settings', '/admin/settings', 'Settings')}
        <a href="/" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', padding: '8px 16px', borderRadius: 18, fontSize: 13, textDecoration: 'none' }}>← View Shop</a>
        <button onClick={handleLogout} style={{ background: 'transparent', color: '#F3FF74', border: '1px solid #F3FF74', padding: '8px 16px', borderRadius: 18, fontSize: 13, cursor: 'pointer' }}>Log out</button>
      </div>
    </div>
  );
}