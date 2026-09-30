/**
 * React hook for subscribing to admin-driven changes across all relevant tables.
 * Fires a callback whenever offers, offer_banners, festivals, discounts,
 * gold_prices, or silver_prices change — so the public site can refetch.
 *
 * Usage:
 *   useRealtimeAdminChanges(['offers', 'offer_banners', 'festivals'], refetchData);
 */
import { useEffect, useRef, useCallback } from 'react';
import {
  subscribeToOffers,
  subscribeToOfferBanners,
  subscribeToFestivals,
  subscribeToDiscounts,
  subscribeToGoldPrices,
  subscribeToSilverPrices,
  subscribeToProducts,
  unsubscribeFromChannels,
  type ChangeHandler,
} from '@/lib/realtime';
import { RealtimeChannel } from '@supabase/supabase-js';

export type AdminTable =
  | 'offers'
  | 'offer_banners'
  | 'festivals'
  | 'discounts'
  | 'gold_prices'
  | 'silver_prices'
  | 'products';

const SUBSCRIBE_MAP: Record<AdminTable, (onChange: ChangeHandler) => RealtimeChannel> = {
  offers: subscribeToOffers,
  offer_banners: subscribeToOfferBanners,
  festivals: subscribeToFestivals,
  discounts: subscribeToDiscounts,
  gold_prices: subscribeToGoldPrices,
  silver_prices: subscribeToSilverPrices,
  products: (onChange) =>
    subscribeToProducts(
      (p) => onChange({ ...p, eventType: 'INSERT' }),
      (p) => onChange({ ...p, eventType: 'UPDATE' }),
    ),
};

/**
 * Subscribe to realtime changes on one or more admin-managed tables.
 * When any subscribed table changes, `onChangeCallback` is invoked.
 * A small debounce (300ms) is applied so rapid successive admin saves
 * only trigger a single refetch.
 */
export function useRealtimeAdminChanges(
  tables: AdminTable[],
  onChangeCallback: () => void,
  debounceMs = 300,
) {
  const channelsRef = useRef<RealtimeChannel[]>([]);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep callback ref stable to avoid re-subscribing on every render
  const callbackRef = useRef(onChangeCallback);
  callbackRef.current = onChangeCallback;

  const debouncedHandler = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      callbackRef.current();
    }, debounceMs);
  }, [debounceMs]);

  useEffect(() => {
    // Only subscribe client-side
    if (typeof window === 'undefined') return;

    const channels: RealtimeChannel[] = [];
    for (const table of tables) {
      const subscribeFn = SUBSCRIBE_MAP[table];
      if (subscribeFn) {
        channels.push(subscribeFn(debouncedHandler));
      }
    }
    channelsRef.current = channels;

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      unsubscribeFromChannels(channelsRef.current);
      channelsRef.current = [];
    };
    // We intentionally stringify tables to avoid re-subscribing when the array reference changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tables.join(','), debouncedHandler]);
}
