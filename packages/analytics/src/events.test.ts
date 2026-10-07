import { configureAnalytics, setAnalyticsEnabled, track, type AnalyticsTransport } from './analytics';
import { buildEventParams } from './events';

describe('buildEventParams', () => {
  it('adds common params and encodes booleans as 0/1', () => {
    expect(
      buildEventParams<'entry_create'>(
        { tag_count: 2, has_photo: true, has_note: false, source: 'fab' },
        { locale: 'vi', app_version: '1.0.0' },
      ),
    ).toEqual({ locale: 'vi', app_version: '1.0.0', tag_count: 2, has_photo: 1, has_note: 0, source: 'fab' });
  });

  it('throws on a forbidden key even if types were bypassed', () => {
    const params = { mood: 4 } as never;
    expect(() => buildEventParams(params, { locale: 'en', app_version: '1.0.0' })).toThrow('mood');
  });
});

describe('consent', () => {
  it('drops events while analytics is off', () => {
    const logEvent = jest.fn();
    const transport: AnalyticsTransport = { logEvent, setCollectionEnabled: jest.fn(), recordError: jest.fn() };
    configureAnalytics({ appVersion: '1.0.0', enabled: false, transport });
    track('paywall_view', { source: 'year' });
    expect(logEvent).not.toHaveBeenCalled();
    setAnalyticsEnabled(true);
    track('paywall_view', { source: 'year' });
    expect(logEvent).toHaveBeenCalledWith('paywall_view', { locale: 'en', app_version: '1.0.0', source: 'year' });
    expect(transport.setCollectionEnabled).toHaveBeenLastCalledWith(true);
  });
});
