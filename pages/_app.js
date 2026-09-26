import '../styles/globals.css';
import { CartProvider } from '../lib/CartContext';

export default function App({ Component, pageProps }) {
  return (
    <CartProvider>
      <Component {...pageProps} />
    </CartProvider>
  );
}
import '../styles/globals.css';
import { CartProvider } from '../lib/CartContext';
import { FavoritesProvider } from '../lib/FavoritesContext';
import { CompareProvider } from '../lib/CompareContext';

export default function App({ Component, pageProps }) {
  return (
    <CartProvider>
      <FavoritesProvider>
        <CompareProvider>
          <Component {...pageProps} />
        </CompareProvider>
      </FavoritesProvider>
    </CartProvider>
  );
}