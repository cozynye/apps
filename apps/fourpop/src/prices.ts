import { getProducts } from '@nf/purchases';
import { useEffect, useState } from 'react';

/** Localized App Store prices of one-time products (packs) by product id; missing while unknown / offline. */
export function useProductPrices(productIds: string[]): Readonly<Record<string, string>> {
  const [prices, setPrices] = useState<Record<string, string>>({});
  const key = productIds.join(',');
  useEffect(() => {
    if (!key) return;
    let alive = true;
    getProducts(key.split(','))
      .then((products) => {
        if (!alive) return;
        setPrices(Object.fromEntries(products.map((p) => [p.identifier, p.priceString])));
      })
      .catch(() => alive && setPrices({}));
    return () => {
      alive = false;
    };
  }, [key]);
  return prices;
}

/** Price of a single product, or null while unknown. */
export function useProductPrice(productId: string | null): string | null {
  const prices = useProductPrices(productId ? [productId] : []);
  return productId ? (prices[productId] ?? null) : null;
}
