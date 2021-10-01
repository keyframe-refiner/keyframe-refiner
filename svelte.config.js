const preprocess = require('svelte-preprocess');

function createPreprocessors(sourceMap = false) {
  return preprocess({
    sourceMap,
    scss: true,
    typescript: true,
    defaults: {
      script: 'typescript',
      style: 'scss',
    },
  });
}

module.exports = {
  createPreprocessors,
  preprocess: createPreprocessors(),
};
