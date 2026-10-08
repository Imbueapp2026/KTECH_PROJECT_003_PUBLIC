/**
 * Realtime subscription utilities for the public app
 * Subscribes to database changes for live updates pushed from admin
 */
import { getAnonClient } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

let channelCounter = 0;

export type ChangeHandler = (payload: {
  new: Record<string, unknown>;
  old: Record<string, unknown>;
  eventType: string;
}) => void;

export type ProductChangeHandler = (payload: {
  new: Record<string, unknown>;
  old: Record<string, unknown>;
}) => void;

export type ProductSubscriptionStatusHandler = (status: string) => void;

// ─── Products ────────────────────────────────────────────────────────────────

/**
 * Subscribe to published product changes (INSERT and UPDATE)
 * Returns a channel that can be used to unsubscribe
 */
export function subscribeToProducts(
  onInsert: ProductChangeHandler,
  onUpdate: ProductChangeHandler,
  onDelete: ProductChangeHandler = () => {},
  onStatus?: ProductSubscriptionStatusHandler,
): RealtimeChannel {
  const supabase = getAnonClient();
  const channelName = `products-changes-${++channelCounter}`;

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'products',
      },
      onInsert
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'products',
      },
      onUpdate
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'products',
      },
      onDelete
    )
    .subscribe((status) => onStatus?.(status));

  return channel;
}

// ─── Category-scoped Products ────────────────────────────────────────────────

/**
 * Subscribe to a specific category's products
 */
export function subscribeToCategoryProducts(
  categoryId: string,
  onInsert: ProductChangeHandler,
  onUpdate: ProductChangeHandler
): RealtimeChannel {
  const supabase = getAnonClient();
  const channelName = `category-${categoryId}-changes-${++channelCounter}`;

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'products',
        filter: `category_id=eq.${categoryId}&status=eq.published`,
      },
      onInsert
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'products',
        filter: `category_id=eq.${categoryId}&status=eq.published`,
      },
      onUpdate
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[Realtime] Subscribed to category ${categoryId} products changes`);
      } else if (status === 'CLOSED') {
        console.log(`[Realtime] Category ${categoryId} subscription closed`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`[Realtime] Category ${categoryId} subscription error`);
      }
    });

  return channel;
}

// ─── Offers ──────────────────────────────────────────────────────────────────

/**
 * Subscribe to offers table changes (admin adds/edits/toggles offers)
 */
export function subscribeToOffers(onChange: ChangeHandler): RealtimeChannel {
  const supabase = getAnonClient();
  const channelName = `offers-changes-${++channelCounter}`;

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'offers' },
      (payload) => onChange({ ...payload, eventType: 'INSERT' } as Parameters<ChangeHandler>[0])
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'offers' },
      (payload) => onChange({ ...payload, eventType: 'UPDATE' } as Parameters<ChangeHandler>[0])
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'offers' },
      (payload) => onChange({ ...payload, eventType: 'DELETE' } as Parameters<ChangeHandler>[0])
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[Realtime] Subscribed to offers changes');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('[Realtime] Offers subscription error');
      }
    });

  return channel;
}

// ─── Offer Banners ───────────────────────────────────────────────────────────

/**
 * Subscribe to offer_banners table changes (admin adds/edits banners)
 */
export function subscribeToOfferBanners(onChange: ChangeHandler): RealtimeChannel {
  const supabase = getAnonClient();
  const channelName = `offer-banners-changes-${++channelCounter}`;

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'offer_banners' },
      (payload) => onChange({ ...payload, eventType: 'INSERT' } as Parameters<ChangeHandler>[0])
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'offer_banners' },
      (payload) => onChange({ ...payload, eventType: 'UPDATE' } as Parameters<ChangeHandler>[0])
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'offer_banners' },
      (payload) => onChange({ ...payload, eventType: 'DELETE' } as Parameters<ChangeHandler>[0])
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[Realtime] Subscribed to offer_banners changes');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('[Realtime] Offer banners subscription error');
      }
    });

  return channel;
}

// ─── Discounts ───────────────────────────────────────────────────────────────

/**
 * Subscribe to discounts table changes (pricing updates from admin)
 */
export function subscribeToDiscounts(onChange: ChangeHandler): RealtimeChannel {
  const supabase = getAnonClient();
  const channelName = `discounts-changes-${++channelCounter}`;

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'discounts' },
      (payload) => onChange({ ...payload, eventType: 'INSERT' } as Parameters<ChangeHandler>[0])
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'discounts' },
      (payload) => onChange({ ...payload, eventType: 'UPDATE' } as Parameters<ChangeHandler>[0])
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'discounts' },
      (payload) => onChange({ ...payload, eventType: 'DELETE' } as Parameters<ChangeHandler>[0])
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[Realtime] Subscribed to discounts changes');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('[Realtime] Discounts subscription error');
      }
    });

  return channel;
}

// ─── Festivals ───────────────────────────────────────────────────────────────

/**
 * Subscribe to festivals table changes (admin activates/edits festivals)
 */
export function subscribeToFestivals(onChange: ChangeHandler): RealtimeChannel {
  const supabase = getAnonClient();
  const channelName = `festivals-changes-${++channelCounter}`;

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'festivals' },
      (payload) => onChange({ ...payload, eventType: 'INSERT' } as Parameters<ChangeHandler>[0])
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'festivals' },
      (payload) => onChange({ ...payload, eventType: 'UPDATE' } as Parameters<ChangeHandler>[0])
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'festivals' },
      (payload) => onChange({ ...payload, eventType: 'DELETE' } as Parameters<ChangeHandler>[0])
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[Realtime] Subscribed to festivals changes');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('[Realtime] Festivals subscription error');
      }
    });

  return channel;
}

// ─── Gold Prices ─────────────────────────────────────────────────────────────

/**
 * Subscribe to gold_prices table changes (admin updates gold rate)
 */
export function subscribeToGoldPrices(onChange: ChangeHandler): RealtimeChannel {
  const supabase = getAnonClient();
  const channelName = `gold-prices-changes-${++channelCounter}`;

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'gold_prices' },
      (payload) => onChange({ ...payload, eventType: 'INSERT' } as Parameters<ChangeHandler>[0])
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'gold_prices' },
      (payload) => onChange({ ...payload, eventType: 'UPDATE' } as Parameters<ChangeHandler>[0])
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[Realtime] Subscribed to gold_prices changes');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('[Realtime] Gold prices subscription error');
      }
    });

  return channel;
}

// ─── Silver Prices ───────────────────────────────────────────────────────────

/**
 * Subscribe to silver_prices table changes (admin updates silver rate)
 */
export function subscribeToSilverPrices(onChange: ChangeHandler): RealtimeChannel {
  const supabase = getAnonClient();
  const channelName = `silver-prices-changes-${++channelCounter}`;

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'silver_prices' },
      (payload) => onChange({ ...payload, eventType: 'INSERT' } as Parameters<ChangeHandler>[0])
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'silver_prices' },
      (payload) => onChange({ ...payload, eventType: 'UPDATE' } as Parameters<ChangeHandler>[0])
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[Realtime] Subscribed to silver_prices changes');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('[Realtime] Silver prices subscription error');
      }
    });

  return channel;
}

// ─── Utilities ───────────────────────────────────────────────────────────────

/**
 * Unsubscribe from a realtime channel
 */
export function unsubscribeFromChannel(channel: RealtimeChannel): void {
  const supabase = getAnonClient();
  supabase.removeChannel(channel);
}

/**
 * Unsubscribe from multiple channels at once
 */
export function unsubscribeFromChannels(channels: RealtimeChannel[]): void {
  const supabase = getAnonClient();
  channels.forEach((channel) => supabase.removeChannel(channel));
}
