import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

export default function AdminSettings() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [settings, setSettings] = useState({ active: false, label: '', sitewide_discount_percent: 0 });
  const [social, setSocial] = useState({ instagram: '', facebook: '', whatsapp: '', tiktok: '', twitter: '' });
  const [logoUrl, setLogoUrl] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingSocial, setSavingSocial] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace('/admin/login');
      else setSession(data.session);
      setChecking(false);
    });
  }, [router]);

  useEffect(() => {
    if (!session) return;
    supabase.from('settings').select('*').eq('key', 'black_friday').single().then(({ data, error }) => {
      if (!error && data) setSettings(data.value);
    });
    supabase.from('settings').select('*').eq('key', 'social_links').single().then(({ data, error }) => {
      if (!error && data) setSocial(data.value);
    });
    supabase.from('settings').select('*').eq('key', 'branding').single().then(({ data, error }) => {
      if (!error && data) setLogoUrl(data.value.logo_url);
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

  const saveSocial = async () => {
    setSavingSocial(true);
    const { error } = await supabase
      .from('settings')
      .update({ value: social, updated_at: new Date().toISOString() })
      .eq('key', 'social_links');
    setSavingSocial(false);
    if (error) alert('Save failed: ' + error.message);
    else alert('Social links saved!');
  };

  const uploadLogo = async (file) => {
    if (!file) return;
    setUploadingLogo(true);
    const ext = file.name.split('.').pop();
    const path = `logo-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('site-assets').upload(path, file, { upsert: true });
    if (uploadError) { alert('Logo upload failed: ' + uploadError.message); setUploadingLogo(false); return; }
    const { data: urlData } = supabase.storage.from('site-assets').getPublicUrl(path);
    const { error: updateError } = await supabase
      .from('settings')
      .update({ value: { logo_url: urlData.publicUrl }, updated_at: new Date().toISOString() })
      .eq('key', 'branding');
    setUploadingLogo(false);
    if (updateError) { alert('Save failed: ' + updateError.message); return; }
    setLogoUrl(urlData.publicUrl);
  };

  const cardStyle = { background: '#fff', border: '1px solid #e0dcd4', borderRadius: 12, padding: 20, marginTop: 20 };
  const inputStyle = { width: '100%', padding: '9px 10px', borderRadius: 7, border: '1px solid #c3ddd3', fontSize: 14 };
  const btnStyle = { marginTop: 14, padding: '10px 18px', background: '#F3FF74', color: '#152D35', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' };

  if (checking || loading) return <p style={{ padding: 24 }}>Loading…</p>;
  if (!session) return null;

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 24 }}>
      <AdminNav active="settings" />
      <h1>Site Settings</h1>

      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>Black Friday</h3>
        <label style={{ display: 'block', marginTop: 12 }}>
          <input type="checkbox" checked={settings.active}
            onChange={(e) => setSettings({ ...settings, active: e.target.checked })} /> Promotion active
        </label>
        <label style={{ display: 'block', marginTop: 12, fontSize: 12, color: '#5b6f6a' }}>Banner label</label>
        <input style={inputStyle} value={settings.label} onChange={(e) => setSettings({ ...settings, label: e.target.value })} />
        <label style={{ display: 'block', marginTop: 12, fontSize: 12, color: '#5b6f6a' }}>Sitewide discount (%)</label>
        <input type="number" min="0" max="100" style={inputStyle} value={settings.sitewide_discount_percent}
          onChange={(e) => setSettings({ ...settings, sitewide_discount_percent: Number(e.target.value) })} />
        <button onClick={save} disabled={saving} style={btnStyle}>{saving ? 'Saving…' : 'Save'}</button>
      </div>

      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>Site Logo</h3>
        <p style={{ fontSize: 12, color: '#5b6f6a' }}>Replaces the text logo in the header and acts as the home button.</p>
        {logoUrl && <img src={logoUrl} alt="Current logo" style={{ height: 50, marginBottom: 8, display: 'block' }} />}
        <input type="file" accept="image/*" disabled={uploadingLogo} onChange={(e) => uploadLogo(e.target.files[0])} />
        {uploadingLogo && <span style={{ fontSize: 12, marginLeft: 8 }}>Uploading…</span>}
      </div>

      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>Social Media Links</h3>
        <p style={{ fontSize: 12, color: '#5b6f6a' }}>These show as icons in a slide-out panel on your homepage.</p>
        {['instagram', 'facebook', 'whatsapp', 'tiktok', 'twitter'].map((platform) => (
          <div key={platform} style={{ marginTop: 12 }}>
            <label style={{ fontSize: 12, color: '#5b6f6a', textTransform: 'capitalize' }}>{platform} URL</label>
            <input
              style={inputStyle}
              placeholder={`https://${platform}.com/yourpage`}
              value={social[platform] || ''}
              onChange={(e) => setSocial({ ...social, [platform]: e.target.value })}
            />
          </div>
        ))}
        <button onClick={saveSocial} disabled={savingSocial} style={btnStyle}>
          {savingSocial ? 'Saving…' : 'Save social links'}
        </button>
      </div>
    </div>
  );
}