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
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
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

  const uploadImage = async (product, file) => {
    if (!file) return;
    setUploadingId(product.id);
    const ext = file.name.split('.').pop();
    const path = `${product.id}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(path, file, { upsert: true });
    if (uploadError) {
      alert('Upload failed: ' + uploadError.message);
      setUploadingId(null);
      return;
    }
    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
    const publicUrl = urlData.publicUrl;
    const { error: updateError } = await supabase
      .from('products')
      .update({ image_url: publicUrl })
      .eq('id', product.id);
    setUploadingId(null);
    if (updateError) { alert('Save image failed: ' + updateError.message); return; }
    updateField(product.id, 'image_url', publicUrl);
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
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Admin Dashboard</h1>
        <div>
          <Link href="/admin/settings" style={{ marginRight: 16 }}>Black Friday Settings</Link>
          <button onClick={handleLogout}>Log out</button>
        </div>
      </div>

      <h3>Add new product</h3>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32, border: '1px solid #ccc', padding: 12, borderRadius: 8 }}>
        <input placeholder="Name" value={newProduct.name}
          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
        <input placeholder="Price" type="number" value={newProduct.price}
          onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} style={{ width: 100 }} />
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {products.map((p) => (
            <div key={p.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div>
                {p.image_url
                  ? <img src={p.image_url} alt={p.name} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6 }} />
                  : <div style={{ width: 80, height: 80, background: '#eee', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>No image</div>}
                <input type="file" accept="image/*" style={{ marginTop: 6, fontSize: 11 }}
                  disabled={uploadingId === p.id}
                  onChange={(e) => uploadImage(p, e.target.files[0])} />
                {uploadingId === p.id && <p style={{ fontSize: 11 }}>Uploading…</p>}
              </div>

              <div style={{ flex: 1, minWidth: 220, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <input value={p.name} onChange={(e) => updateField(p.id, 'name', e.target.value)} />
                <textarea value={p.description || ''} onChange={(e) => updateField(p.id, 'description', e.target.value)} rows={2} />
                <select value={p.category} onChange={(e) => updateField(p.id, 'category', e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 140 }}>
                <label style={{ fontSize: 12 }}>Price ($)</label>
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
          ))}
        </div>
      )}
    </div>
  );
}