import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push('/admin');
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #152D35 0%, #244a52 55%, #D4ECDD 100%)', padding: 20,
    }}>
      <form onSubmit={handleLogin} style={{
        background: '#fff', borderRadius: 14, padding: '36px 32px', width: '100%', maxWidth: 380,
        boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
      }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 22, color: '#152D35', letterSpacing: 1 }}>SOCRATELUXE</h1>
        <p style={{ margin: '0 0 24px', fontSize: 13, color: '#5b6f6a' }}>Admin dashboard</p>

        <label style={{ fontSize: 12, color: '#5b6f6a', display: 'block', marginBottom: 4 }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #c3ddd3', fontSize: 14, marginBottom: 16 }}
        />

        <label style={{ fontSize: 12, color: '#5b6f6a', display: 'block', marginBottom: 4 }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #c3ddd3', fontSize: 14, marginBottom: 8 }}
        />

        {error && <p style={{ color: '#c0392b', fontSize: 13, margin: '8px 0' }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', padding: 12, marginTop: 12, background: '#F3FF74', color: '#152D35',
            border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </div>
  );
}