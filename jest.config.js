/** Unit tests for shared packages and app logic (apps/<app>/src). Pure logic lives in plain .ts files tested with jest-expo. */
module.exports = {
  preset: 'jest-expo/ios',
  testMatch: ['<rootDir>/{packages,apps}/*/src/**/*.test.ts?(x)'],
  // Agent worktrees are full copies of this repo; their packages would clash in the module map.
  modulePathIgnorePatterns: ['<rootDir>/.claude/'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|react-native-svg|react-native-purchases|react-native-mmkv|react-native-nitro-modules|i18next|react-i18next|uuidv7)',
  ],
};
