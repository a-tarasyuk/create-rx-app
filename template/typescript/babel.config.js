module.exports = function(api) {
  api.cache.forever();

  if (process.env.RX_PLATFORM === 'web') {
    return {
      presets: [
        '@babel/preset-env',
        '@babel/preset-react',
        '@babel/typescript',
      ],
      plugins: [
        '@babel/plugin-transform-runtime',
        '@babel/proposal-object-rest-spread',
        '@babel/proposal-class-properties',
      ],
    };
  }

  return {
    presets: ['module:metro-react-native-babel-preset'],
    plugins: [],
  };
};
