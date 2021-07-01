const path = require('path');

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
      (compiler) => {
        const TerserPlugin = require('terser-webpack-plugin');
        new TerserPlugin({
          parallel: true,
          terserOptions: {
            compress: {},
            ecma: 6,
            mangle: true
          }
        }).apply(compiler);
      },
    ]
  }
}
