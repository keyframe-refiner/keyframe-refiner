import sveltePreprocess from 'svelte-preprocess';
import postcssConfig from './postcss.config.cjs';

export function createPreprocessors(sourceMap = false) {
  return sveltePreprocess({
    sourceMap,
    scss: true,
    typescript: true,
    postcss: postcssConfig,
  });
}

export const preprocess = createPreprocessors();
