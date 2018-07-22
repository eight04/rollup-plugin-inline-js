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
    load: id => {
      if (!/^\0inline[\w-]*:/.test(id)) {
        return;
      }
      id = id.slice(1);
      const pipes = parsePipes(id);
      const source = {
        name: "file",
        args: pipes[1].args
      };
      pipes.splice(1, 1);
      const target = {
        name: pipes[0].name.replace(/^inline-?/, "") || "file",
        args: pipes[0].args
      };
      return loadConfig()
        .then(() => inliner.inline(target, source))
        .then(({content, children}) => 
          inliner.transformer.transform(
            {
              source,
              inlineTarget: target
            },
            content,
            pipes.slice(1)
          )
            .then(content => {
              const dependencies = new Set;
              extractTarget(children);
              const code = stringify(content);
              if (typeof code !== "string") {
                throw new Error(`The content loaded from ${id} is not a string`);
              }
              return {
                code: `export default ${code};`,
                dependencies: [...dependencies]
              };
              
              function extractTarget(results) {
                for (const {target, children} of results) {
                  if (!PATH_LIKE.has(target.name)) {
                    continue;
                  }
                  dependencies.add(target.args[0]);
                  extractTarget(children);
                }
              }
            })
        );
        
      function loadConfig() {
        if (PATH_LIKE.has(target.name)) {
          const file = path.resolve(source.args[0], target.args[0]);
          return configLocator.findConfig(file)
            .then(result => {
              if (result) {
                inliner.useConfig(result.config);
              }
            });
        }
        return Promise.resolve();
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
