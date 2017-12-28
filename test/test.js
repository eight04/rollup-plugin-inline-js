/* eslint-env mocha */
const assert = require("power-assert");
const rollup = require("rollup");

function test(options) {
  [
    // first dependencies
    "..", "inline-js",
    // sub dependencies
    ...[
      "transformer", "resource", "shortcut", "conf"
    ].map(n => `inline-js/lib/${n}`)
  ].forEach(name => {
    delete require.cache[require.resolve(name)];
  });

  const inlinejs = require("..");
  return rollup.rollup({input: options.input, plugins: inlinejs(options)})
    .then(bundle => bundle.generate({format: "es"}))
    .then(({code}) => {
      const firstLine = code.split("\n")[0];
      assert(code && firstLine === options.expect);
    });
}

function mustFail() {
  throw new Error("must fail");
}

describe("rollup-plugin-inline-js", () => {
  it("use transform cssmin", () => {
    return test({
      input: `${__dirname}/cssmin/test.js`,
      expect: 'var css = "body{color:#000}";'
    });
  }).timeout(5000);

  it("stringify buffer", () => {
    const fs = require("fs");
    
    function stringify(content) {
      if (Buffer.isBuffer(content)) {
        return `Buffer.from(${JSON.stringify(content.toString("base64"))}, "base64")`;
      }
      return JSON.stringify(content);
    }
    
    return test({
      input: `${__dirname}/stringify/test.js`,
      expect: fs.readFileSync(`${__dirname}/stringify/expect.js`, "utf8"),
      stringify
    });
  });
  
  it("use config", () => {
    return test({
      input: `${__dirname}/conf/test.js`,
      expect: 'var css = "OK";'
    });
  });
  
  it("throw if content is not a string", () => {
    return test({
      input: `${__dirname}/allow-null/test.js`
    })
      .then(mustFail)
      .catch(err => {
        assert(err.message.includes("not a string"));
      });
  });
  
  it("test cmd resource", () => {
    const path = require("path");
    const cd = path.resolve(`${__dirname}/cmd`);
    return test({
      input: `${__dirname}/cmd/test.js`,
      expect: `var cd = ${JSON.stringify(cd)};`
    });
  });
});
