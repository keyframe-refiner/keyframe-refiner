import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

import sass from 'sass';
import webpack from 'webpack';
import ESLintPlugin from 'eslint-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import FaviconsWebpackPlugin from 'favicons-webpack-plugin';
import { createPreprocessors } from '../svelte.config.js';

export const fromRootTo = path.resolve.bind(path, dirname(fileURLToPath(import.meta.url)), '..');

export function getVersion() {
  const packageJson = JSON.parse(readFileSync(fromRootTo('package.json'), 'utf8'));

  return packageJson.version;
}

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

export function createTsloaderConfig(project) {
  return {
    test: /\.ts$/,
    include: [fromRootTo(`src/${project}`)],
    use: [{
      loader: 'ts-loader',
      options: {
        instance: project,
        configFile: fromRootTo(`src/${project}/tsconfig.json`),
      },
    }],
  };
}

export function createBaseConfig(dev = false) {
  return {
    entry: fromRootTo('src/app/index.ts'),
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
        createTsloaderConfig('app'),
        createTsloaderConfig('worker'),
        createTsloaderConfig('shared'),
        {
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
                    fromRootTo('src/app/theme'),
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
      new webpack.DefinePlugin({
        __DEV_MODE__: dev,
        __VERSION__: JSON.stringify(getVersion()),
      }),
      new FaviconsWebpackPlugin({
        logo: fromRootTo('assets/logo.png'),
        favicons: {
          lang: 'ja-JP',
          appName: 'Keyframe Refiner',
          appShortName: 'Keyframe Refiner',
        },
      }),
      new HtmlWebpackPlugin({
        title: 'Keyframe Refiner - 原画位置合わせ',
        meta: {
          viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
        },
      }),
    ],
  };
}
