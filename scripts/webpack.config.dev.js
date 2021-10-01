const path = require('path');

const ESLintPlugin = require('eslint-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const { createPreprocessors } = require('../svelte.config');

const absolutePathTo = path.resolve.bind(path, __dirname, '..');

module.exports = {
  resolve: {
    extensions: ['.ts', '.js', '.mjs', '.svelte'],
    mainFields: ['svelte', 'browser', 'module', 'main'],
    alias: {
      svelte: path.resolve('node_modules', 'svelte'),
    },
  },
  devtool: 'cheap-module-source-map',
  entry: absolutePathTo('src/index.ts'),
  module: {
    rules: [{
      test: /\.svelte$/,
      use: {
        loader: 'svelte-loader',
        options: {
          compilerOptions: {
            dev: true,
          },
          // NOTE emitCss: true is currently not supported with HMR
          // Enable it for production to output separate css file
          emitCss: false,
          hotReload: true,
          preprocess: createPreprocessors(true),
        },
      },
    }, {
      test: /node_modules\/svelte\/.*\.mjs$/,
      resolve: {
        fullySpecified: false,
      },
    }, {
      test: /\.ts$/,
      use: [{
        loader: 'ts-loader',
      }],
    }, {
      test: /\.s[ac]ss$/i,
      use: [
        'style-loader',
        'css-loader',
        {
          loader: 'sass-loader',
          options: {
            implementation: require('sass'),
            sassOptions: {
              quietDeps: true,
              includePaths: [
                absolutePathTo('src/theme'),
                absolutePathTo('node_modules'),
              ],
            },
          },
        },
      ],
    }, {
      test: /\.css$/i,
      use: [
        'style-loader',
        'css-loader?sourceMap=true',
      ],
    }],
  },
  output: {
    path: absolutePathTo('dist/renderer'),
    filename: '[name].js',
  },
  devServer: {
    contentBase: absolutePathTo('.'),
    hot: true,
    host: '0.0.0.0',
    port: 3000,
    publicPath: '/',
  },
  plugins: [
    new ESLintPlugin(),
    new HtmlWebpackPlugin({
      title: 'Storyboard',
      meta: {
        'Content-Security-Policy': {
          'http-equiv': 'Content-Security-Policy',
          content: "script-src 'self'",
        },
      },
    }),
  ],
};
