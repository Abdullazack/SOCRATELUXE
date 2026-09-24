import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

const CATEGORIES = ['clothes', 'shoes', 'gents-accessories', 'ladies-accessories'];

export default function AdminDashboard() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [products, setProducts] = useState([]);
  const [imagesByProduct, setImagesByProduct] = useState({});
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
  const [uploadingVideoId, setUploadingVideoId] = useState(null);
  const [managingProduct, setManagingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: CATEGORIES[0], description: '' });
  const [addingNew, setAddingNew] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace('/admin/login');
      else setSession(data.session);
      setChecking(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (!sess) router.replace('/admin/login');
    });
    return () => listener.subscription.unsubscribe();
  }, [router]);

  const loadProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').order('id');
    if (data) setProducts(data);

    const { data: imgs } = await supabase.from('product_images').select('*').order('position');
    if (imgs) {
      const grouped = {};
      imgs.forEach((img) => {
        if (!grouped[img.product_id]) grouped[img.product_id] = [];
        grouped[img.product_id].push(img);
      });
      setImagesByProduct(grouped);
    }
    setLoading(false);
  };

  useEffect(() => { if (session) loadProducts(); }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  const updateField = (id, field, value) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
    setManagingProduct((prev) => (prev && prev.id === id ? { ...prev, [field]: value } : prev));
  };

  const saveProduct = async (product) => {
    setSavingId(product.id);
    const { error } = await supabase.from('products').update({
      name: product.name, price: product.price, category: product.category,
      description: product.description, discount_percent: product.discount_percent || 0,
      trending: product.trending, active: product.active,
    }).eq('id', product.id);
    setSavingId(null);
    if (error) alert('Save failed: ' + error.message);
    else alert('Saved!');
  };

  const deleteProduct = async (id) => {
    if (!confirm('Delete this product permanently?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { alert('Delete failed: ' + error.message); return; }
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setManagingProduct(null);
  };

  const uploadImages = async (product, fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    setUploadingId(product.id);
    const existing = imagesByProduct[product.id] || [];
    let position = existing.length;
    for (const file of files) {
      const ext = file.name.split('.').pop();
      const path = `${product.id}-${Date.now()}-${position}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file, { upsert: true });
      if (uploadError) { alert(`Upload failed for ${file.name}: ` + uploadError.message); continue; }
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
      const { data: inserted, error: insertError } = await supabase
        .from('product_images').insert({ product_id: product.id, url: urlData.publicUrl, position }).select();
      if (!insertError && inserted) {
        setImagesByProduct((prev) => ({ ...prev, [product.id]: [...(prev[product.id] || []), inserted[0]] }));
      }
      position += 1;
    }
    setUploadingId(null);
  };

  const deleteImage = async (productId, image) => {
    if (!confirm('Remove this image?')) return;
    const { error } = await supabase.from('product_images').delete().eq('id', image.id);
    if (error) { alert('Delete failed: ' + error.message); return; }
    setImagesByProduct((prev) => ({ ...prev, [productId]: (prev[productId] || []).filter((img) => img.id !== image.id) }));
  };

  const uploadVideo = async (product, file) => {
    if (!file) return;
    setUploadingVideoId(product.id);
    const ext = file.name.split('.').pop();
    const path = `${product.id}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('product-videos').upload(path, file, { upsert: true });
    if (uploadError) { alert('Video upload failed: ' + uploadError.message); setUploadingVideoId(null); return; }
    const { data: urlData } = supabase.storage.from('product-videos').getPublicUrl(path);
    const { error: updateError } = await supabase.from('products').update({ video_url: urlData.publicUrl }).eq('id', product.id);
    setUploadingVideoId(null);
    if (updateError) { alert('Save video failed: ' + updateError.message); return; }
    updateField(product.id, 'video_url', urlData.publicUrl);
  };

  const createProduct = async () => {
    if (!newProduct.name || !newProduct.price) { alert('Name and price are required.'); return; }
    setAddingNew(true);
    const { data, error } = await supabase.from('products').insert({
      name: newProduct.name, price: parseFloat(newProduct.price), category: newProduct.category,
      description: newProduct.description, active: true,
    }).select();
    setAddingNew(false);
    if (error) { alert('Create failed: ' + error.message); return; }
    setProducts((prev) => [...prev, data[0]]);
    setNewProduct({ name: '', price: '', category: CATEGORIES[0], description: '' });
  };

  const cardStyle = { background: '#fff', border: '1px solid #e0dcd4', borderRadius: 12, padding: 20 };
  const inputStyle = { padding: '9px 10px', borderRadius: 7, border: '1px solid #c3ddd3', fontSize: 14 };
  const navBtn = { background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.35)', padding: '8px 16px', borderRadius: 18, fontSize: 13, textDecoration: 'none', cursor: 'pointer' };

  if (checking) return <p style={{ padding: 24 }}>Checking session…</p>;
  if (!session) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#D4ECDD' }}>
      <div style={{ background: '#152D35', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ color: '#fff', margin: 0, fontSize: 18, letterSpacing: 1 }}>SOCRATELUXE <span style={{ color: '#F3FF74', fontWeight: 400, fontSize: 13 }}>· Admin</span></h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a href="/" style={navBtn}>← View Shop</a>
          <Link href="/admin/orders" style={navBtn}>Orders</Link>
          <Link href="/admin/settings" style={navBtn}>Settings</Link>
          <button onClick={handleLogout} style={{ ...navBtn, background: '#F3FF74', color: '#152D35', fontWeight: 700, border: 'none' }}>Log out</button>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
        <div style={{ ...cardStyle, marginBottom: 24 }}>
          <h3 style={{ marginTop: 0 }}>Add new product</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input style={{ ...inputStyle, flex: '1 1 160px' }} placeholder="Name" value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
            <input style={{ ...inputStyle, width: 120 }} placeholder="Price (Rwf)" type="number" value={newProduct.price}
              onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} />
            <select style={inputStyle} value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input style={{ ...inputStyle, flex: '1 1 200px' }} placeholder="Description" value={newProduct.description}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} />
            <button onClick={createProduct} disabled={addingNew}
              style={{ padding: '9px 18px', background: '#F3FF74', border: 'none', borderRadius: 7, fontWeight: 700, cursor: 'pointer' }}>
              {addingNew ? 'Adding…' : 'Add product'}
            </button>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Inventory ({products.length})</h3>
            <input
              placeholder="🔍 Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...inputStyle, width: 220 }}
            />
          </div>
          {loading ? <p>Loading…</p> : (() => {
            const filtered = products.filter((p) =>
              p.name.toLowerCase().includes(search.toLowerCase())
            );
            const grouped = {};
            filtered.forEach((p) => {
              if (!grouped[p.category]) grouped[p.category] = [];
              grouped[p.category].push(p);
            });
            const categoryNames = Object.keys(grouped).sort();

            if (filtered.length === 0) {
              return <p style={{ color: '#5b6f6a', fontSize: 13 }}>No products match "{search}".</p>;
            }

            return categoryNames.map((cat) => (
              <div key={cat} style={{ marginBottom: 18 }}>
                <p style={{
                  fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
                  color: '#152D35', background: '#D4ECDD', display: 'inline-block',
                  padding: '3px 10px', borderRadius: 10, marginBottom: 6,
                }}>
                  {cat} ({grouped[cat].length})
                </p>
                {grouped[cat].map((p) => {
                  const images = imagesByProduct[p.id] || [];
                  const thumb = images[0]?.url || p.image_url;
                  return (
                    <div key={p.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                      borderBottom: '1px solid #eee', flexWrap: 'wrap',
                    }}>
                      {thumb ? (
                        <img src={thumb} alt="" style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 44, height: 44, borderRadius: 6, background: '#eee' }} />
                      )}
                      <div style={{ flex: 1, minWidth: 140 }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{p.name}</p>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, minWidth: 90 }}>{Number(p.price).toLocaleString()} Rwf</span>
                      <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 10, background: p.active ? '#d7f0dd' : '#f5d7d7', color: p.active ? '#2f7a4d' : '#c0392b' }}>
                        {p.active ? 'Active' : 'Hidden'}
                      </span>
                      {p.trending && <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 10, background: '#152D35', color: '#F3FF74' }}>Trending</span>}
                      <span style={{ fontSize: 11, color: images.length >= 3 ? '#2f7a4d' : '#b45309' }}>{images.length} imgs</span>
                      <button onClick={() => setManagingProduct(p)}
                        style={{ padding: '6px 14px', background: '#152D35', color: '#fff', border: 'none', borderRadius: 16, fontSize: 12, cursor: 'pointer' }}>
                        Manage
                      </button>
                    </div>
                  );
                })}
              </div>
            ));
          })()}
        </div>
      </div>

      {managingProduct && (
        <div onClick={() => setManagingProduct(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '40px 16px',
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, padding: 24, width: '100%', maxWidth: 640 }}>
            {(() => {
              const p = products.find((prod) => prod.id === managingProduct.id) || managingProduct;
              const images = imagesByProduct[p.id] || [];
              return (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h2 style={{ margin: 0 }}>Manage product</h2>
                    <button onClick={() => setManagingProduct(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }}>×</button>
                  </div>

                  <label style={{ fontSize: 12, color: '#5b6f6a' }}>Name</label>
                  <input style={{ ...inputStyle, width: '100%', marginBottom: 10 }} value={p.name} onChange={(e) => updateField(p.id, 'name', e.target.value)} />

                  <label style={{ fontSize: 12, color: '#5b6f6a' }}>Description</label>
                  <textarea style={{ ...inputStyle, width: '100%', marginBottom: 10 }} rows={2} value={p.description || ''} onChange={(e) => updateField(p.id, 'description', e.target.value)} />

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                    <div>
                      <label style={{ fontSize: 12, color: '#5b6f6a' }}>Category</label><br />
                      <select style={inputStyle} value={p.category} onChange={(e) => updateField(p.id, 'category', e.target.value)}>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: '#5b6f6a' }}>Price (Rwf)</label><br />
                      <input type="number" style={inputStyle} value={p.price} onChange={(e) => updateField(p.id, 'price', e.target.value)} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: '#5b6f6a' }}>Discount (%)</label><br />
                      <input type="number" min="0" max="100" style={inputStyle} value={p.discount_percent || 0} onChange={(e) => updateField(p.id, 'discount_percent', e.target.value)} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
                    <label style={{ fontSize: 13 }}><input type="checkbox" checked={!!p.trending} onChange={(e) => updateField(p.id, 'trending', e.target.checked)} /> Trending</label>
                    <label style={{ fontSize: 13 }}><input type="checkbox" checked={!!p.active} onChange={(e) => updateField(p.id, 'active', e.target.checked)} /> Active (visible)</label>
                  </div>

                  <div style={{ borderTop: '1px solid #eee', paddingTop: 12, marginBottom: 12 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: images.length >= 3 ? '#2f7a4d' : '#b45309', margin: '0 0 8px' }}>
                      Images: {images.length} {images.length >= 3 ? '✓' : '— needs at least 3'}
                    </p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                      {images.map((img) => (
                        <div key={img.id} style={{ position: 'relative' }}>
                          <img src={img.url} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6 }} />
                          <button onClick={() => deleteImage(p.id, img)} style={{ position: 'absolute', top: -6, right: -6, background: '#c00', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, cursor: 'pointer', fontSize: 11 }}>×</button>
                        </div>
                      ))}
                    </div>
                    <input type="file" accept="image/*" multiple disabled={uploadingId === p.id} onChange={(e) => uploadImages(p, e.target.files)} />
                    {uploadingId === p.id && <span style={{ fontSize: 12, marginLeft: 8 }}>Uploading…</span>}
                  </div>

                  <div style={{ borderTop: '1px solid #eee', paddingTop: 12, marginBottom: 16 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 8px' }}>Video (~5s): {p.video_url ? '✓ uploaded' : '— none yet'}</p>
                    {p.video_url && <video src={p.video_url} controls style={{ width: 140, borderRadius: 6, marginBottom: 8, display: 'block' }} />}
                    <input type="file" accept="video/*" disabled={uploadingVideoId === p.id} onChange={(e) => uploadVideo(p, e.target.files[0])} />
                    {uploadingVideoId === p.id && <span style={{ fontSize: 12, marginLeft: 8 }}>Uploading…</span>}
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => saveProduct(p)} disabled={savingId === p.id}
                      style={{ flex: 1, padding: 12, background: '#F3FF74', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                      {savingId === p.id ? 'Saving…' : 'Save changes'}
                    </button>
                    <button onClick={() => deleteProduct(p.id)}
                      style={{ padding: 12, background: '#fff', border: '1px solid #c0392b', color: '#c0392b', borderRadius: 8, cursor: 'pointer' }}>
                      Delete
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}