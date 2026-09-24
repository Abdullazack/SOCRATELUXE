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
  const [newProduct, setNewProduct] = useState({
    name: '', price: '', category: CATEGORIES[0], description: '',
  });
  const [addingNew, setAddingNew] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/admin/login');
      } else {
        setSession(data.session);
      }
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
    const { data, error } = await supabase.from('products').select('*').order('id');
    if (!error) setProducts(data || []);

    const { data: imgs, error: imgErr } = await supabase
      .from('product_images')
      .select('*')
      .order('position');
    if (!imgErr && imgs) {
      const grouped = {};
      imgs.forEach((img) => {
        if (!grouped[img.product_id]) grouped[img.product_id] = [];
        grouped[img.product_id].push(img);
      });
      setImagesByProduct(grouped);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (session) loadProducts();
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  const updateField = (id, field, value) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const saveProduct = async (product) => {
    setSavingId(product.id);
    const { error } = await supabase
      .from('products')
      .update({
        name: product.name,
        price: product.price,
        category: product.category,
        description: product.description,
        discount_percent: product.discount_percent || 0,
        trending: product.trending,
        active: product.active,
      })
      .eq('id', product.id);
    setSavingId(null);
    if (error) alert('Save failed: ' + error.message);
  };

  const deleteProduct = async (id) => {
    if (!confirm('Delete this product permanently?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { alert('Delete failed: ' + error.message); return; }
    setProducts((prev) => prev.filter((p) => p.id !== id));
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
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(path, file, { upsert: true });
      if (uploadError) {
        alert(`Upload failed for ${file.name}: ` + uploadError.message);
        continue;
      }
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
      const { data: inserted, error: insertError } = await supabase
        .from('product_images')
        .insert({ product_id: product.id, url: urlData.publicUrl, position })
        .select();
      if (!insertError && inserted) {
        setImagesByProduct((prev) => ({
          ...prev,
          [product.id]: [...(prev[product.id] || []), inserted[0]],
        }));
      }
      position += 1;
    }
    setUploadingId(null);
  };

  const deleteImage = async (productId, image) => {
    if (!confirm('Remove this image?')) return;
    const { error } = await supabase.from('product_images').delete().eq('id', image.id);
    if (error) { alert('Delete failed: ' + error.message); return; }
    setImagesByProduct((prev) => ({
      ...prev,
      [productId]: (prev[productId] || []).filter((img) => img.id !== image.id),
    }));
  };

  const uploadVideo = async (product, file) => {
    if (!file) return;
    setUploadingVideoId(product.id);
    const ext = file.name.split('.').pop();
    const path = `${product.id}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('product-videos')
      .upload(path, file, { upsert: true });
    if (uploadError) {
      alert('Video upload failed: ' + uploadError.message);
      setUploadingVideoId(null);
      return;
    }
    const { data: urlData } = supabase.storage.from('product-videos').getPublicUrl(path);
    const { error: updateError } = await supabase
      .from('products')
      .update({ video_url: urlData.publicUrl })
      .eq('id', product.id);
    setUploadingVideoId(null);
    if (updateError) { alert('Save video failed: ' + updateError.message); return; }
    updateField(product.id, 'video_url', urlData.publicUrl);
  };

  const createProduct = async () => {
    if (!newProduct.name || !newProduct.price) { alert('Name and price are required.'); return; }
    setAddingNew(true);
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        category: newProduct.category,
        description: newProduct.description,
        active: true,
      })
      .select();
    setAddingNew(false);
    if (error) { alert('Create failed: ' + error.message); return; }
    setProducts((prev) => [...prev, data[0]]);
    setNewProduct({ name: '', price: '', category: CATEGORIES[0], description: '' });
  };

  if (checking) return <p style={{ padding: 24 }}>Checking session…</p>;
  if (!session) return null;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Admin Dashboard</h1>
        <div>
          <Link href="/admin/orders" style={{ marginRight: 16 }}>Orders</Link>
          <Link href="/admin/settings" style={{ marginRight: 16 }}>Black Friday Settings</Link>
          <button onClick={handleLogout}>Log out</button>
        </div>
      </div>

      <h3>Add new product</h3>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32, border: '1px solid #ccc', padding: 12, borderRadius: 8 }}>
        <input placeholder="Name" value={newProduct.name}
          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
        <input placeholder="Price (Rwf)" type="number" value={newProduct.price}
          onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} style={{ width: 120 }} />
        <select value={newProduct.category}
          onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input placeholder="Description" value={newProduct.description}
          onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} style={{ flex: 1, minWidth: 160 }} />
        <button onClick={createProduct} disabled={addingNew}>
          {addingNew ? 'Adding…' : 'Add product'}
        </button>
      </div>

      <h3>Products ({products.length})</h3>
      {loading ? <p>Loading…</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {products.map((p) => {
            const images = imagesByProduct[p.id] || [];
            const imageCountOk = images.length >= 3;
            return (
              <div key={p.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 220, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <input value={p.name} onChange={(e) => updateField(p.id, 'name', e.target.value)} />
                    <textarea value={p.description || ''} onChange={(e) => updateField(p.id, 'description', e.target.value)} rows={2} />
                    <select value={p.category} onChange={(e) => updateField(p.id, 'category', e.target.value)}>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 140 }}>
                    <label style={{ fontSize: 12 }}>Price (Rwf)</label>
                    <input type="number" value={p.price} onChange={(e) => updateField(p.id, 'price', e.target.value)} />
                    <label style={{ fontSize: 12 }}>Discount (%)</label>
                    <input type="number" min="0" max="100" value={p.discount_percent || 0}
                      onChange={(e) => updateField(p.id, 'discount_percent', e.target.value)} />
                    <label style={{ fontSize: 12 }}>
                      <input type="checkbox" checked={!!p.trending}
                        onChange={(e) => updateField(p.id, 'trending', e.target.checked)} /> Trending
                    </label>
                    <label style={{ fontSize: 12 }}>
                      <input type="checkbox" checked={!!p.active}
                        onChange={(e) => updateField(p.id, 'active', e.target.checked)} /> Active (visible on site)
                    </label>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button onClick={() => saveProduct(p)} disabled={savingId === p.id}>
                      {savingId === p.id ? 'Saving…' : 'Save'}
                    </button>
                    <button onClick={() => deleteProduct(p.id)} style={{ color: 'red' }}>Delete</button>
                  </div>
                </div>

                <div style={{ marginTop: 12, borderTop: '1px solid #eee', paddingTop: 12 }}>
                  <p style={{ fontSize: 13, fontWeight: 'bold', color: imageCountOk ? 'green' : '#b45309' }}>
                    Images: {images.length} {imageCountOk ? '✓' : '— needs at least 3'}
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                    {images.map((img) => (
                      <div key={img.id} style={{ position: 'relative' }}>
                        <img src={img.url} alt="" style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 6 }} />
                        <button
                          onClick={() => deleteImage(p.id, img)}
                          style={{
                            position: 'absolute', top: -6, right: -6, background: '#c00', color: '#fff',
                            border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', fontSize: 12,
                          }}
                        >×</button>
                      </div>
                    ))}
                  </div>
                  <input
                    type="file" accept="image/*" multiple
                    disabled={uploadingId === p.id}
                    onChange={(e) => uploadImages(p, e.target.files)}
                  />
                  {uploadingId === p.id && <span style={{ fontSize: 12, marginLeft: 8 }}>Uploading…</span>}
                </div>

                <div style={{ marginTop: 12, borderTop: '1px solid #eee', paddingTop: 12 }}>
                  <p style={{ fontSize: 13, fontWeight: 'bold' }}>
                    Video (~5s): {p.video_url ? '✓ uploaded' : '— none yet'}
                  </p>
                  {p.video_url && (
                    <video src={p.video_url} controls style={{ width: 160, borderRadius: 6, marginBottom: 8 }} />
                  )}
                  <br />
                  <input
                    type="file" accept="video/*"
                    disabled={uploadingVideoId === p.id}
                    onChange={(e) => uploadVideo(p, e.target.files[0])}
                  />
                  {uploadingVideoId === p.id && <span style={{ fontSize: 12, marginLeft: 8 }}>Uploading…</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}