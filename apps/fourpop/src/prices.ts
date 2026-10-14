import { getProducts } from '@nf/purchases';
import { useEffect, useState } from 'react';

/** Localized App Store price of a one-time product (pack), or null while unknown / offline. */
export function useProductPrice(productId: string | null): string | null {
  const [price, setPrice] = useState<string | null>(null);
  useEffect(() => {
    if (!productId) return;
    let alive = true;
    getProducts([productId])
      .then((products) => alive && setPrice(products[0]?.priceString ?? null))
      .catch(() => alive && setPrice(null));
    return () => {
      alive = false;
    };
  }, [productId]);
  return price;
}
