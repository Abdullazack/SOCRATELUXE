import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState({});

  useEffect(() => {
    const saved = localStorage.getItem('socrateluxe_cart');
    if (saved) setCart(JSON.parse(saved));

    const onStorage = (e) => {
      if (e.key === 'socrateluxe_cart') {
        setCart(e.newValue ? JSON.parse(e.newValue) : {});
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    localStorage.setItem('socrateluxe_cart', JSON.stringify(cart));
  }, [cart]);

  const add = (product) => {
    setCart((c) => ({ ...c, [product.id]: (c[product.id] || 0) + 1 }));
  };
  const remove = (id) => {
    setCart((c) => {
      const next = { ...c };
      delete next[id];
      return next;
    });
  };
  const clear = () => setCart({});

  return (
    <CartContext.Provider value={{ cart, add, remove, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);