import { LINK_LENGTH_ESTIMATE, campaignLink, ctToken } from './links';

test('campaign link carries pt, ct and mt', () => {
  expect(campaignLink({ app: 'nuni', providerToken: '12345', ct: 'threads_vi' })).toBe(
    'https://apps.apple.com/app/apple-store/id6821789626?pt=12345&ct=threads_vi&mt=8',
  );
});

test('missing provider token still opens the store', () => {
  expect(campaignLink({ app: 'fourpop', providerToken: '', ct: 'landing_fourpop' })).toBe(
    'https://apps.apple.com/app/apple-store/id6821789911?ct=landing_fourpop&mt=8',
  );
});

test('ct token and estimate', () => {
  expect(ctToken('instagram', 'th')).toBe('instagram_th');
  expect(LINK_LENGTH_ESTIMATE).toBeGreaterThan(60);
});
