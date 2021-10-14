import { merge } from 'webpack-merge';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

import { createBaseConfig } from './webpack.base.js';

export default merge(createBaseConfig(false), {
  target: 'browserslist',
  mode: 'production',
  optimization: {
    minimize: true,
    moduleIds: 'deterministic',
    splitChunks: {
      cacheGroups: {
        vendor: {
          name: 'vendors',
          test: /[\\/]node_modules[\\/]/,
          chunks: 'all',
        },
      },
    },
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
  ],
});
