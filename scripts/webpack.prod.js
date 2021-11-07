import { merge } from 'webpack-merge';
import { GenerateSW } from 'workbox-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

import { createBaseConfig } from './webpack.base.js';

export default merge(createBaseConfig(false), {
  target: 'browserslist',
  mode: 'production',
  output: {
    filename: '[name].[contenthash].js',
  },
  module: {
    rules: [{
      test: /\.css$/,
      use: [
        MiniCssExtractPlugin.loader,
        'css-loader',
      ],
    }],
  },
  optimization: {
    minimize: true,
    splitChunks: {
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          chunks: 'all',
          name(module) {
            const isOpenCV = module.context.includes('opencv-ts');
            return isOpenCV ? 'opencv' : 'vendors';
          },
        },
      },
    },
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
    }),
    new GenerateSW({
      maximumFileSizeToCacheInBytes: 10_000_000,
      exclude: ['index.html'],
      runtimeCaching: [{
        urlPattern: 'index.html',
        handler: 'NetworkFirst',
      }, {
        urlPattern: '/',
        handler: 'NetworkFirst',
      }],
    }),
  ],
});
