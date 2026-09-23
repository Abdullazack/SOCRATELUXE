import { useState, useEffect } from 'react';

export default function Lightbox({ product, onClose }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [product]);

  if (!product) return null;

  const images = product.images || [];
  const hasVideo = !!product.video_url;
  const totalSlides = images.length + (hasVideo ? 1 : 0);
  const showingVideo = hasVideo && index === images.length;

  const next = () => setIndex((i) => (i + 1) % totalSlides);
  const prev = () => setIndex((i) => (i - 1 + totalSlides) % totalSlides);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 20, right: 24, fontSize: 28, color: '#fff',
          background: 'none', border: 'none', cursor: 'pointer', zIndex: 1002,
        }}
      >
        ×
      </button>

      {totalSlides > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); prev(); }}
          style={{
            position: 'absolute', left: 16, fontSize: 32, color: '#fff',
            background: 'none', border: 'none', cursor: 'pointer', zIndex: 1002,
          }}
        >
          ‹
        </button>
      )}

      <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '85vh' }}>
        {showingVideo ? (
          <video
            src={product.video_url}
            controls
            autoPlay
            style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: 8 }}
          />
        ) : (
          <img
            src={images[index]}
            alt={product.name}
            style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: 8, objectFit: 'contain' }}
          />
        )}
        <p style={{ color: '#fff', textAlign: 'center', marginTop: 12 }}>
          {product.name} — {index + 1} / {totalSlides}
        </p>
      </div>

      {totalSlides > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); next(); }}
          style={{
            position: 'absolute', right: 16, fontSize: 32, color: '#fff',
            background: 'none', border: 'none', cursor: 'pointer', zIndex: 1002,
          }}
        >
          ›
        </button>
      )}
    </div>
  );
}