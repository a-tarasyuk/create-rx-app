module.exports = function(api) {
	api.cache.forever();

	if (process.env.RX_PLATFORM === 'web') {
	  return {
		presets: [
		  ['@babel/preset-env', { 'targets': { 'browsers': ['last 2 versions'] } }],
		  ['@babel/preset-react', {}],
		],
		plugins: ['@babel/plugin-transform-runtime'],
	  };
	}

	return {
	  presets: ['module:metro-react-native-babel-preset'],
	};
};
