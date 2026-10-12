import { recordError, track } from '@nf/analytics';
import { AppState, Linking, Platform } from 'react-native';
import Purchases, {
  INTRO_ELIGIBILITY_STATUS,
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
  type PurchasesStoreProduct,
} from 'react-native-purchases';

import { mirrorFromActive } from './entitlements';
import { useEntitlementStore } from './store';

let configured = false;

function applyCustomerInfo(info: CustomerInfo) {
  useEntitlementStore.getState().setFromCustomerInfo(mirrorFromActive(info.entitlements.active));
}

/**
 * Call once from the app root. Missing key → warning and purchases disabled (dev builds must not
 * crash, CLAUDE.md). Anonymous app user id; no login.
 */
export function configurePurchases(apiKey: string | undefined) {
  if (configured) return;
  if (!apiKey) {
    console.warn('[purchases] No RevenueCat API key; purchases are disabled.');
    return;
  }
  if (Platform.OS !== 'ios') return;
  if (__DEV__) void Purchases.setLogLevel(LOG_LEVEL.WARN);
  Purchases.configure({ apiKey });
  configured = true;
  useEntitlementStore.getState().setEnabled(true);

  Purchases.addCustomerInfoUpdateListener(applyCustomerInfo);
  void refreshCustomerInfo();
  // Re-read entitlements whenever the app returns to the foreground (PLAN 결제 도중 앱 종료).
  AppState.addEventListener('change', (state) => {
    if (state === 'active') void refreshCustomerInfo();
  });
}

export async function refreshCustomerInfo(): Promise<CustomerInfo | null> {
  if (!configured) return null;
  try {
    const info = await Purchases.getCustomerInfo();
    applyCustomerInfo(info);
    return info;
  } catch (error) {
    recordError(error as Error, 'getCustomerInfo');
    return null;
  }
}

export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  if (!configured) return null;
  const offerings = await Purchases.getOfferings();
  return offerings.current;
}

/** Non-consumable products (Fourpop packs) are fetched by id, not through an offering. */
export async function getProducts(productIds: string[]): Promise<PurchasesStoreProduct[]> {
  if (!configured || productIds.length === 0) return [];
  return Purchases.getProducts(productIds, Purchases.PRODUCT_CATEGORY.NON_SUBSCRIPTION);
}

/** Product ids → whether the free trial / intro offer is available to this Apple ID. */
export async function getTrialEligibility(productIds: string[]): Promise<Record<string, boolean>> {
  if (!configured || productIds.length === 0) return {};
  const result = await Purchases.checkTrialOrIntroductoryPriceEligibility(productIds);
  return Object.fromEntries(
    Object.entries(result).map(([id, e]) => [
      id,
      e.status !== INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_INELIGIBLE,
    ]),
  );
}

export type PurchaseOutcome =
  { status: 'success'; info: CustomerInfo } | { status: 'cancelled' } | { status: 'failed'; code: string };

function errorCode(error: unknown): string {
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : 'unknown';
}

async function purchase(
  productId: string,
  run: () => Promise<{ customerInfo: CustomerInfo }>,
): Promise<PurchaseOutcome> {
  track('purchase_start', { product_id: productId });
  try {
    const { customerInfo } = await run();
    applyCustomerInfo(customerInfo);
    track('purchase_success', { product_id: productId });
    return { status: 'success', info: customerInfo };
  } catch (error) {
    const code = errorCode(error);
    if (code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) return { status: 'cancelled' };
    track('purchase_fail', { product_id: productId, error_code: code });
    return { status: 'failed', code };
  }
}

export function purchasePackage(pkg: PurchasesPackage): Promise<PurchaseOutcome> {
  return purchase(pkg.product.identifier, () => Purchases.purchasePackage(pkg));
}

export function purchaseProduct(product: PurchasesStoreProduct): Promise<PurchaseOutcome> {
  return purchase(product.identifier, () => Purchases.purchaseStoreProduct(product));
}

export type RestoreOutcome = 'restored' | 'none' | 'failed';

/** Restore is the only path after reinstall (no accounts). "None" is not a failure. */
export async function restorePurchases(): Promise<RestoreOutcome> {
  if (!configured) return 'failed';
  try {
    const info = await Purchases.restorePurchases();
    applyCustomerInfo(info);
    return Object.keys(info.entitlements.active).length > 0 ? 'restored' : 'none';
  } catch (error) {
    recordError(error as Error, 'restorePurchases');
    return 'failed';
  }
}

/**
 * Settings › Manage subscription: Apple's subscription sheet. Falls back to the App Store account
 * page when the SDK is not configured (missing key in dev).
 */
export async function showManageSubscriptions(): Promise<void> {
  if (configured) {
    try {
      await Purchases.showManageSubscriptions();
      return;
    } catch (error) {
      recordError(error as Error, 'showManageSubscriptions');
    }
  }
  await Linking.openURL('https://apps.apple.com/account/subscriptions');
}
