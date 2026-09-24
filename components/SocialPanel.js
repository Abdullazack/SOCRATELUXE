import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const PLATFORMS = [
  { key: 'instagram', label: 'IG', color: '#E1306C', name: 'Instagram' },
  { key: 'facebook', label: 'FB', color: '#1877F2', name: 'Facebook' },
  { key: 'whatsapp', label: 'WA', color: '#25D366', name: 'WhatsApp' },
  { key: 'tiktok', label: 'TT', color: '#000000', name: 'TikTok' },
  { key: 'twitter', label: 'X', color: '#000000', name: 'X (Twitter)' },
];

export default function SocialPanel() {
  const [links, setLinks] = useState({});
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase
      .from('settings')
      .select('*')
      .eq('key', 'social_links')
      .single()
      .then(({ data, error }) => {
        if (!error && data) setLinks(data.value || {});
      });
  }, []);

  const activePlatforms = PLATFORMS.filter((p) => links[p.key]);
  if (activePlatforms.length === 0) return null;

  return (
    <div style={{ position: 'fixed', top: '50%', right: 0, transform: 'translateY(-50%)', zIndex: 40 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          transform: open ? 'translateX(0)' : 'translateX(calc(100% - 40px))',
          transition: 'transform 0.3s ease',
        }}
      >
        <button
          onClick={() => setOpen((o) => !o)}
          style={{
            width: 40,
            background: '#152D35',
            color: '#F3FF74',
            border: 'none',
            borderRadius: '10px 0 0 10px',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 700,
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            padding: '14px 0',
          }}
        >
          {open ? 'Hide' : 'Follow us'}
        </button>

        <div
          style={{
            background: '#D4ECDD',
            padding: '16px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            boxShadow: '-4px 0 12px rgba(0,0,0,0.12)',
          }}
        >
          {activePlatforms.map((p) => (
            
              <a key={p.key}
              href={links[p.key]}
              target="_blank"
              rel="noopener noreferrer"
              title={p.name}
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: p.color,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              {p.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}