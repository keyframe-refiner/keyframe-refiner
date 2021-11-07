import { merge } from 'webpack-merge';

import { createBaseConfig, fromRootTo } from './webpack.base.js';

export default merge(createBaseConfig(true), {
  // should switch `target` to 'browserlist' in production mode,
  // see: https://github.com/webpack/webpack-dev-server/issues/2758#issuecomment-710086019
  target: 'web',
  mode: 'development',
  devtool: 'cheap-module-source-map',
  devServer: {
    hot: true,
    port: 3000,
    static: {
      // force reload when worker script changes
      directory: fromRootTo('src/worker'),
      publicPath: '/worker',
    },
  },
});
