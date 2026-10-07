/** Unit tests for shared packages. Pure logic lives in plain .ts files tested with jest-expo. */
module.exports = {
  preset: 'jest-expo/ios',
  testMatch: ['<rootDir>/packages/*/src/**/*.test.ts?(x)'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|react-native-svg|react-native-purchases|react-native-mmkv|react-native-nitro-modules|i18next|react-i18next|uuidv7)',
  ],
};
