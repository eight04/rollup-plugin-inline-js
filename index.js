const path = require("path");

const {createInliner} = require("inline-js-core");
const {RESOURCES, PATH_LIKE} = require("inline-js-default-resources");
const {TRANSFORMS} = require("inline-js-default-transforms");
const {createConfigLocator} = require("config-locator");
const {parsePipes, pipesToString} = require("inline-js-core/lib/parser");

function createPlugin({
  stringify = JSON.stringify,
  inlineOptions
} = {}) {
  const inliner = createInliner(inlineOptions);
  RESOURCES.forEach(inliner.resource.add);
  TRANSFORMS.forEach(inliner.transformer.add);
  
  const configLocator = createConfigLocator({config: ".inline.js"});
  
  return {
    name: "rollup-plugin-inline-js",
    load: async id => {
      if (!/^\0inline[\w-]*:/.test(id)) {
        return;
      }
      id = id.slice(1);
      const [target, source, ...transforms] = parsePipes(id);
      target.name = target.name.replace(/^inline-?/, "") || "file";
      source.name = "file";
      
      if (PATH_LIKE.has(target.name)) {
        const file = path.resolve(source.args[0], target.args[0]);
        const result = await configLocator.findConfig(file);
        if (result) {
          inliner.useConfig(result.config);
        }
      }
      const {content, children} = await inliner.inline(target, source);
      const transformedContent = await inliner.transformer.transform(
        {
          source,
          inlineTarget: target
        },
        content,
        transforms
      );
          
      const dependencies = new Set;
      extractDependencies(children);
      
      const code = stringify(transformedContent);
      if (typeof code !== "string") {
        throw new Error(`The content loaded from ${id} is not a string`);
      }
      return {
        code: `export default ${code};`,
        dependencies: [...dependencies]
      };
      
      function extractDependencies(children) {
        for (const {target, children: subChildren} of children) {
          if (!PATH_LIKE.has(target.name)) {
            continue;
          }
          dependencies.add(target.args[0]);
          extractDependencies(subChildren);
        }
      }
    },
    resolveId: (importee, importer) => {
      if (!/^inline[\w-]*:/.test(importee)) {
        return;
      }
      const pipes = parsePipes(importee);
      pipes.splice(1, 0, {name: "importer", args: [importer]});
      return '\0' + pipesToString(pipes);
    }
  };
}

module.exports = createPlugin;
