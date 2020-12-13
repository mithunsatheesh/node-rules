const path = require('path');
const webpack = require('webpack');
const TaserJSPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'node-rules.min.js',
    libraryTarget: 'umd',
    library: 'NodeRules'
  },
  optimization: {
    minimizer: [
      // we specify a custom UglifyJsPlugin here to get source maps in production
      new TaserJSPlugin({
        cache: true,
        parallel: true,
        terserOptions: {
          compress: false,
          ecma: 6,
          mangle: true
        },
        sourceMap: true
      })
    ]
  }
}
