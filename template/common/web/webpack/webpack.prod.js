const webpack = require('webpack');
const merge = require('webpack-merge');
const { config } = require('./webpack.common');

module.exports = merge(config, {
  mode: 'production',
  plugins: [
    new webpack.DefinePlugin({ __DEV__: false }),
  ]
});
