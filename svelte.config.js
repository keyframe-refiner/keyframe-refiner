const preprocess = require('svelte-preprocess');

function createPreprocessors(sourceMap = false) {
  return preprocess({
    sourceMap,
    scss: true,
    typescript: true,
  });
}

module.exports = {
  createPreprocessors,
  preprocess: createPreprocessors(),
};
