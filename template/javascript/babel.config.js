module.exports = function(api) {
  api.cache.forever();

  const commonPlugins = ['@babel/plugin-transform-runtime'];

  if (process.env.RX_PLATFORM === 'web') {
    return {
      presets: [
        ['@babel/preset-env', { 'targets': { 'browsers': ['last 2 versions'] } }],
        ['@babel/preset-react', {}],
      ],
      plugins: [...commonPlugins],
    };
  }

  return {
    presets: ['module:metro-react-native-babel-preset'],
    plugins: [...commonPlugins],
  };
};
