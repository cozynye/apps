/**
 * Analytics events (PLAN 수익 모델 › 분석 이벤트). Names are snake_case.
 * Never add personal data, diary text, tag names, or mood values to any event.
 */
export type NuniPaywallSource =
  | 'year'
  | 'lifts'
  | 'backup'
  | 'widget'
  | 'tag'
  | 'photo'
  | 'note'
  | 'share'
  | 'settings';
export type FourpopPaywallSource = 'hd' | 'gif' | 'filter' | 'pack' | 'banner' | 'settings' | 'shop';
export type PaywallSource = NuniPaywallSource | FourpopPaywallSource;

export interface EventParams {
  onboarding_complete: { analytics_opt_in: boolean };
  paywall_view: { source: PaywallSource };
  purchase_start: { product_id: string };
  purchase_success: { product_id: string };
  purchase_fail: { product_id: string; error_code: string };
  entry_create: {
    tag_count: number;
    has_photo: boolean;
    has_note: boolean;
    source: 'fab' | 'widget' | 'notification' | 'calendar';
  };
  streak_milestone: { days: 3 | 7 | 30 };
  share_card: { period: 'month' | 'year' };
  booth_start: { frame_id: string; pack_id: string; source: 'camera' | 'album' };
  booth_complete: { frame_id: string; filter: string; hd: boolean; duration_ms: number };
  booth_share: {
    channel: 'photos' | 'zalo' | 'messenger' | 'line' | 'instagram' | 'system' | 'gif';
  };
  pack_view: { pack_id: string };
  pack_unlock: { pack_id: string; method: 'single' | 'premium' };
  permission_denied: { type: 'camera' | 'photos' | 'notifications' };
}

export type EventName = keyof EventParams;

export interface CommonParams {
  locale: string;
  app_version: string;
}

/** Firebase accepts string/number params; booleans are sent as 0/1. */
export type WireParams = Record<string, string | number>;

/** Keys that must never leave the device, even by mistake (checked at runtime too). */
export const FORBIDDEN_PARAM_KEYS = ['mood', 'note', 'text', 'tag_name', 'tags', 'email', 'name'];

export function buildEventParams<E extends EventName>(
  params: EventParams[E],
  common: CommonParams,
): WireParams {
  const out: WireParams = { locale: common.locale, app_version: common.app_version };
  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    if (FORBIDDEN_PARAM_KEYS.includes(key)) {
      throw new Error(`analytics: forbidden param "${key}"`);
    }
    if (typeof value === 'boolean') out[key] = value ? 1 : 0;
    else if (typeof value === 'string' || typeof value === 'number') out[key] = value;
  }
  return out;
}
