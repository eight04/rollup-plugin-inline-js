// const {init: inline} = require("inline-js");
const {createInliner} = require("inline-js-core");
const {parsePipes, pipesToString} = require("inline-js-core/lib/parser");

function createPlugin({
  stringify = JSON.stringify,
  inlineOptions
} = {}) {
  return {
    name: "rollup-plugin-inline-js",
    load: id => {
      if (!/^\0inline[\w-]*:/.test(id)) {
        return;
      }
      id = id.slice(1);
      const pipes = parsePipes(id);
      let source;
      if (pipes[1] && pipes[1].name === "importer") {
        source = {
          name: "file",
          args: pipes[1].args
        };
        pipes.splice(1, 1);
      }
      const target = {
        name: pipes[0].name.replace(/^inline-?/, "") || "file",
        args: pipes[0].args
      };
      const options = {source, target, transforms: pipes.slice(1)};
      Object.assign(options, inlineOptions);
      return inline(options)
        .then(content => {
          content = stringify(content);
          if (typeof content !== "string") {
            throw new Error(`The content loaded from ${id} is not a string`);
          }
          return `export default ${content};`;
        });
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
