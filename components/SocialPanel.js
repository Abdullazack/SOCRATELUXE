import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const COLORS = {
  facebook: '#1877F2',
  instagram: '#E1306C',
  whatsapp: '#25D366',
  tiktok: '#000000',
  twitter: '#000000',
};

const PATHS = {
  facebook: 'M22 12a10 10 0 10-11.5 9.9v-7H7.9V12h2.6V9.8c0-2.6 1.5-4 3.9-4 1.1 0 2.3.2 2.3.2v2.5h-1.3c-1.3 0-1.7.8-1.7 1.6V12h2.9l-.5 2.9h-2.4v7A10 10 0 0022 12z',
  instagram: 'M12 2c2.7 0 3 0 4.1.06 1.1.05 1.8.2 2.4.45.7.27 1.2.6 1.7 1.1.5.5.9 1.1 1.1 1.7.25.7.4 1.4.45 2.5C21.9 9 22 9.3 22 12s0 3-.06 4.1c-.05 1.1-.2 1.8-.45 2.5-.27.7-.6 1.2-1.1 1.7-.5.5-1.1.9-1.7 1.1-.7.25-1.4.4-2.5.45C15 21.9 14.7 22 12 22s-3 0-4.1-.06c-1.1-.05-1.8-.2-2.5-.45a4.6 4.6 0 01-1.7-1.1 4.6 4.6 0 01-1.1-1.7c-.25-.7-.4-1.4-.45-2.5C2.1 15 2 14.7 2 12s0-3 .06-4.1c.05-1.1.2-1.8.45-2.5.27-.7.6-1.2 1.1-1.7.5-.5 1.1-.9 1.7-1.1.7-.25 1.4-.4 2.5-.45C9 2.1 9.3 2 12 2zm0 1.8c-2.6 0-2.9 0-4 .06-.9.04-1.4.18-1.7.3-.4.16-.7.35-1 .65-.3.3-.5.6-.66 1-.12.3-.26.8-.3 1.7C4.3 8.6 4.3 8.9 4.3 12s0 2.9.06 4c.04.9.18 1.4.3 1.7.16.4.35.7.65 1 .3.3.6.5 1 .66.3.12.8.26 1.7.3 1.1.06 1.4.06 4 .06s2.9 0 4-.06c.9-.04 1.4-.18 1.7-.3.4-.16.7-.35 1-.65.3-.3.5-.6.66-1 .12-.3.26-.8.3-1.7.06-1.1.06-1.4.06-4s0-2.9-.06-4c-.04-.9-.18-1.4-.3-1.7a1.8 1.8 0 00-.65-1 1.8 1.8 0 00-1-.66c-.3-.12-.8-.26-1.7-.3-1.1-.06-1.4-.06-4-.06zm0 3.5a4.7 4.7 0 110 9.4 4.7 4.7 0 010-9.4zm0 1.8a2.9 2.9 0 100 5.8 2.9 2.9 0 000-5.8zm5.9-2a1.1 1.1 0 11-2.2 0 1.1 1.1 0 012.2 0z',
  whatsapp: 'M17 14.2c-.3-.1-1.6-.8-1.8-.9-.2-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.1.2-.3.2-.6.1-.3-.1-1.2-.4-2.2-1.4-.8-.7-1.4-1.6-1.5-1.9-.2-.3 0-.4.1-.6l.4-.5c.1-.1.2-.3.2-.4.1-.2 0-.3 0-.4-.1-.1-.6-1.5-.8-2-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.1 0 1.2.9 2.4 1 2.6.1.2 1.8 2.8 4.4 3.9.6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.6-.6 1.8-1.3.2-.6.2-1.1.2-1.2-.1-.2-.3-.2-.5-.3zM12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1120.2 12 8.2 8.2 0 0112 20.2z',
  tiktok: 'M16.6 5.8a4.3 4.3 0 01-2.7-1V15a5.3 5.3 0 11-4.6-5.3v2.4a2.9 2.9 0 102.1 2.8V2h2.5a4.3 4.3 0 003.7 3.6v2.2a6.7 6.7 0 01-1-.1z',
  twitter: 'M18.9 3H22l-7 8 8.2 10h-6.4l-5-6.5L5.8 21H2.6l7.5-8.6L2 3h6.5l4.5 6 5.9-6zM17.7 19h1.8L7.4 5H5.5L17.7 19z',
};

const PLATFORMS = ['instagram', 'facebook', 'whatsapp', 'tiktok', 'twitter'];

function SocialIcon({ platformKey }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path d={PATHS[platformKey]} fill="#fff" />
    </svg>
  );
}

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

  const active = PLATFORMS.filter((k) => links[k]);
  if (active.length === 0) return null;

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
          {active.map((key) => (
            
              <a key={key}
              href={links[key]}
              target="_blank"
              rel="noopener noreferrer"
              title={key}
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: COLORS[key],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
              }}
            >
              <SocialIcon platformKey={key} />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}