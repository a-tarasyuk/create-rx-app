const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const ROOT_PATH = path.join(__dirname, '..', '..');
const DIST_PATH = path.join(ROOT_PATH, 'dist-web');
const APP_PATH = path.join(ROOT_PATH, 'src');
const WEB_PATH = path.join(ROOT_PATH, 'web');
const TS_CONFIG_PATH = path.join(ROOT_PATH, 'tsconfig.json');

const config = {
  entry: APP_PATH,
  output: {
    filename: 'bundle.js',
    path: DIST_PATH,
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },

  module: {
    rules: [{
      test: /\.tsx?$/,
      loader: 'ts-loader',
      options: { configFile: TS_CONFIG_PATH },
      exclude: /node_modules/,
    }]
  },

  plugins: [
    new HtmlWebpackPlugin({ inject: true, template: path.join(WEB_PATH, 'template.html') }),
  ],
};

module.exports = { config, APP_PATH, DIST_PATH };
