// Used by Jest at the repo root. Apps use Expo's default Babel config.
module.exports = function (api) {
  api.cache(true);
  return { presets: ['babel-preset-expo'] };
};
