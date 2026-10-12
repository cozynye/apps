// Nuni home widget (PLAN 위젯): small = today's cloud or "tap to log", medium = last 7 days.
// Colors come from design/tokens.json (no hardcoded hex); data from widget.json in the App Group.
const tokens = require('../../../../design/tokens.json');

const color = (name) => tokens.color.tokens.find((t) => t.name === name).value;
const themed = (name) => ({ light: color(name).light, dark: color(name).dark });

/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'widget',
  name: 'NuniWidget',
  deploymentTarget: '17.0',
  colors: {
    $widgetBackground: themed('surface-0'),
    $accent: themed('nuni-primary'),
    ink: themed('ink'),
    inkMuted: themed('ink-muted'),
    line: themed('line'),
    deep: themed('nuni-deep'),
  },
  images: {
    mood1: './images/mood-1.png',
    mood2: './images/mood-2.png',
    mood3: './images/mood-3.png',
    mood4: './images/mood-4.png',
    mood5: './images/mood-5.png',
  },
  entitlements: {
    'com.apple.security.application-groups': config.ios.entitlements['com.apple.security.application-groups'],
  },
});
