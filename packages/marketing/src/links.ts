import { APP_IDS, type App, type Channel, type Locale } from './constants';

/** Campaign token: one per channel × language so App Store Connect › Analytics › Campaigns splits installs by source. */
export function ctToken(channel: Channel | 'landing', locale: Locale | App): string {
  return `${channel}_${locale}`;
}

/**
 * App Store campaign link. `pt` (provider token) comes from App Store Connect › Analytics › Acquisition › Campaigns;
 * until Cozy fills marketing/links.json the link still opens the store, just without attribution.
 */
export function campaignLink(opts: { app: App; providerToken?: string | null; ct: string }): string {
  const u = new URL(`https://apps.apple.com/app/apple-store/id${APP_IDS[opts.app]}`);
  const pt = opts.providerToken?.trim();
  if (pt) u.searchParams.set('pt', pt);
  u.searchParams.set('ct', opts.ct);
  u.searchParams.set('mt', '8');
  return u.toString();
}

/** Longest realistic link, used when validating caption length before the real pt is known. */
export const LINK_LENGTH_ESTIMATE = campaignLink({ app: 'fourpop', providerToken: '123456789', ct: 'instagram_th' }).length;
