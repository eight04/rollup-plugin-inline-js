/* eslint-env mocha */
const assert = require("assert");

const rollup = require("rollup");
const {withDir} = require("tempdir-yaml");

const createPlugin = require("..");

async function bundle(file) {
  const warns = [];
  const bundle = await rollup.rollup({
    input: [file],
    plugins: [
      createPlugin()
    ],
    experimentalCodeSplitting: true,
    onwarn(warn) {
      // https://github.com/rollup/rollup/issues/2308
      warns.push(warn);
    }
  });
  const modules = bundle.cache.modules.slice();
  const result = await bundle.generate({
    format: "es",
    legacy: true,
    freeze: false,
    sourcemap: true
  });
  result.warns = warns;
  result.modules = modules;
  return result;
}

describe("rollup-plugin-inline-js", () => {
  it("use transform cssmin", t => {
    t.timeout(20000);
    return withDir(`
      - entry.js: |
          console.log($inline("test.css|cssmin|stringify"));
      - test.css: |
          body {
            color: black;
          }
    `, async resolve => {
      const result = await bundle(resolve("entry.js"));
      assert.equal(result.output["entry.js"].code.trim(), 'console.log("body{color:#000}");');
    });
  });

  it("use config", () =>
    withDir(`
      - entry.js: |
          console.log($inline("foo.txt|trim|mytransform"));
      - foo.txt: |
          foo
      - .inline.js: |
          module.exports = {
            transforms: [
              {
                name: "mytransform",
                transform: (context, content) => content.toUpperCase()
              }
            ]
          };
    `, async resolve => {
      const result = await bundle(resolve("entry.js"));
      assert.equal(result.output["entry.js"].code.trim(), 'console.log(FOO);');
    })
  );
  
  it("test cmd resource", () =>
    withDir(String.raw`
      - entry.js: |
          console.log($inline("cmd: node -e \"console.log(process.cwd())\"|trim|stringify"));
    `, async resolve => {
      const result = await bundle(resolve("entry.js"));
      assert.equal(
        result.output["entry.js"].code.trim(),
        `console.log(${JSON.stringify(resolve())});`
      );
    })
  );

  it("nested inline", () =>
    withDir(`
      - entry.js: |
          console.log($inline("test.css|cssmin|stringify"));
      - test.css: |
          body {
            color: $inline("color.txt");
          }
      - color.txt: |
          black
    `, async resolve => {
      const result = await bundle(resolve("entry.js"));
      assert.equal(
        result.output["entry.js"].code.trim(),
        'console.log("body{color:#000}");'
      );
    })
  );
});
