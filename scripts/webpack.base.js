import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

import sass from 'sass';
import ESLintPlugin from 'eslint-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import FaviconsWebpackPlugin from 'favicons-webpack-plugin';

import { createPreprocessors } from '../svelte.config.js';

export const fromRootTo = path.resolve.bind(path, dirname(fileURLToPath(import.meta.url)), '..');

export function createSvelteConfig(include, dev, immutable) {
  return {
    test: /\.svelte$/,
    include,
    use: {
      loader: 'svelte-loader',
      options: {
        compilerOptions: {
          dev,
          immutable,
          hydratable: true,
        },
        // NOTE emitCss: true is currently not supported with HMR
        // Enable it for production to output separate css file
        emitCss: !dev,
        hotReload: dev,
        preprocess: createPreprocessors(dev),
      },
    },
  };
}

export function createBaseConfig(dev = false) {
  return {
    entry: fromRootTo('src/index.ts'),
    resolve: {
      extensions: ['.ts', '.js', '.mjs', '.svelte'],
      mainFields: ['svelte', 'browser', 'module', 'main'],
      alias: {
        svelte: path.resolve('node_modules', 'svelte'),
      },
    },
    module: {
      rules: [
        // FIXME: immutable breaks @smui/dialog
        createSvelteConfig(fromRootTo('src'), dev, true),
        createSvelteConfig(fromRootTo('node_modules'), dev, false),
        {
          test: /\.ts$/,
          use: [{
            loader: 'ts-loader',
          }],
        }, {
          test: /\.s[ac]ss$/i,
          use: [
            'style-loader',
            'css-loader',
            'postcss-loader',
            {
              loader: 'sass-loader',
              options: {
                implementation: sass,
                sassOptions: {
                  quietDeps: true,
                  includePaths: [
                    fromRootTo('src/theme'),
                    fromRootTo('node_modules'),
                  ],
                },
              },
            },
          ],
        }, {
          test: /\.css$/i,
          use: [
            'style-loader',
            'css-loader',
            'postcss-loader',
          ],
        }],
    },
    output: {
      path: fromRootTo('dist'),
      filename: '[name].js',
    },
    plugins: [
      new ESLintPlugin(),
      new FaviconsWebpackPlugin(fromRootTo('assets/logo.png')),
      new HtmlWebpackPlugin({
        title: '原画位置合わせ',
        meta: {
          viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
        },
      }),
    ],
  };
}
