const {createFilter} = require("@rollup/pluginutils");

const {createInliner} = require("inline-js-core");
const {RESOURCES, PATH_LIKE} = require("inline-js-default-resources");
const {TRANSFORMS} = require("inline-js-default-transforms");
const {createConfigLocator} = require("config-locator");

function* extractDependencies(children) {
  for (const {target, children: subChildren} of children) {
    if (!PATH_LIKE.has(target.name)) {
      continue;
    }
    yield target.args[0];
    yield* extractDependencies(subChildren);
  }
}

function createPlugin({
  include,
  exclude,
  inlineOptions
} = {}) {
  const filter = createFilter(include, exclude);
  
  const inliner = createInliner(inlineOptions);
  RESOURCES.forEach(inliner.resource.add);
  TRANSFORMS.forEach(inliner.transformer.add);
  
  const configLocator = createConfigLocator({config: ".inline.js"});
  
  return {
    name: "rollup-plugin-inline-js",
    async transform(code, id) {
      if (!filter(id)) {
        return;
      }
      if (!code.includes("$inline")) {
        return;
      }
      // find config
      const conf = await configLocator.findConfig(id);
      if (conf) {
        inliner.useConfig(conf.config);
      }
      // inline
      const {content, children} = await inliner.inline({
        target: {
          name: "file",
          args: [id]
        },
        content: code
      });
      for (const file of new Set(extractDependencies(children))) {
        this.addWatchFile(file);
      }
      return {
        code: content
      };
    },
    buildEnd: () => {
      inliner.resource.cache.clear();
    }
  };
}

module.exports = createPlugin;
