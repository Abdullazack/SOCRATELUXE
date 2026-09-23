import { supabase } from '../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { buyer, paymentMethod, lines, total } = req.body;

  if (!buyer?.name || !buyer?.phone || !buyer?.address || !lines?.length) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      buyer_name: buyer.name,
      buyer_phone: buyer.phone,
      buyer_address: buyer.address,
      payment_method: paymentMethod,
      total,
    })
    .select()
    .single();

  if (orderError) {
    return res.status(500).json({ error: orderError.message });
  }

  const itemRows = lines.map((l) => ({
    order_id: order.id,
    product_id: l.id,
    name: l.name,
    price: l.price,
    qty: l.qty,
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(itemRows);

  if (itemsError) {
    return res.status(500).json({ error: itemsError.message });
  }

  return res.status(200).json({ orderId: order.id });
}
