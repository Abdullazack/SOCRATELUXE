import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

export default function AdminSettings() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [settings, setSettings] = useState({ active: false, label: '', sitewide_discount_percent: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/admin/login');
      } else {
        setSession(data.session);
      }
      setChecking(false);
    });
  }, [router]);

  useEffect(() => {
    if (!session) return;
    supabase.from('settings').select('*').eq('key', 'black_friday').single().then(({ data, error }) => {
      if (!error && data) setSettings(data.value);
      setLoading(false);
    });
  }, [session]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('settings')
      .update({ value: settings, updated_at: new Date().toISOString() })
      .eq('key', 'black_friday');
    setSaving(false);
    if (error) alert('Save failed: ' + error.message);
    else alert('Saved!');
  };

  if (checking || loading) return <p style={{ padding: 24 }}>Loading…</p>;
  if (!session) return null;

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 24 }}>
      <Link href="/admin">← Back to dashboard</Link>
      <h1>Black Friday Settings</h1>

      <label style={{ display: 'block', marginTop: 16 }}>
        <input
          type="checkbox"
          checked={settings.active}
          onChange={(e) => setSettings({ ...settings, active: e.target.checked })}
        /> Promotion active
      </label>

      <label style={{ display: 'block', marginTop: 16 }}>Banner label</label>
      <input
        style={{ width: '100%', padding: 8 }}
        value={settings.label}
        onChange={(e) => setSettings({ ...settings, label: e.target.value })}
      />

      <label style={{ display: 'block', marginTop: 16 }}>Sitewide discount (%)</label>
      <input
        type="number" min="0" max="100"
        style={{ width: '100%', padding: 8 }}
        value={settings.sitewide_discount_percent}
        onChange={(e) => setSettings({ ...settings, sitewide_discount_percent: Number(e.target.value) })}
      />
      <p style={{ fontSize: 12, color: '#666' }}>
        This applies to all products in addition to any individual product discount you set in the dashboard.
      </p>

      <button onClick={save} disabled={saving} style={{ marginTop: 20, padding: '10px 16px' }}>
        {saving ? 'Saving…' : 'Save settings'}
      </button>
    </div>
  );
}