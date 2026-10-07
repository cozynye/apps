import { buildEventParams, type CommonParams, type EventName, type EventParams, type WireParams } from './events';

/**
 * Where events go. The Firebase transport is added with @react-native-firebase once the
 * GoogleService-Info.plist files exist (P18); until then events are only logged in dev builds.
 */
export interface AnalyticsTransport {
  logEvent(name: string, params: WireParams): void;
  setCollectionEnabled(enabled: boolean): void;
  recordError(error: Error, context?: string): void;
}

const devTransport: AnalyticsTransport = {
  logEvent: (name, params) => {
    if (__DEV__) console.log(`[analytics] ${name}`, params);
  },
  setCollectionEnabled: (enabled) => {
    if (__DEV__) console.log(`[analytics] collection ${enabled ? 'on' : 'off'}`);
  },
  recordError: (error, context) => {
    if (__DEV__) console.warn(`[crashlytics] non-fatal${context ? ` (${context})` : ''}`, error);
  },
};

let transport: AnalyticsTransport = devTransport;
let common: CommonParams = { locale: 'en', app_version: '0.0.0' };
let enabled = true;

export function configureAnalytics(options: {
  appVersion: string;
  enabled: boolean;
  transport?: AnalyticsTransport;
}) {
  transport = options.transport ?? devTransport;
  common = { ...common, app_version: options.appVersion };
  setAnalyticsEnabled(options.enabled);
}

/** Follows the user's analytics consent (`settings.analytics`). */
export function setAnalyticsEnabled(value: boolean) {
  enabled = value;
  transport.setCollectionEnabled(value);
}

export function setAnalyticsLocale(locale: string) {
  common = { ...common, locale };
}

export function track<E extends EventName>(name: E, params: EventParams[E]) {
  if (!enabled) return;
  transport.logEvent(name, buildEventParams<E>(params, common));
}

/** Crashlytics non-fatal (e.g. manifest download failure, DB migration failure). */
export function recordError(error: Error, context?: string) {
  transport.recordError(error, context);
}
