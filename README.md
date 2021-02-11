rollu-plugin-inline-js
======================

[![Build Status](https://travis-ci.com/eight04/rollup-plugin-inline-js.svg?branch=master)](https://travis-ci.com/eight04/rollup-plugin-inline-js)
[![Coverage Status](https://coveralls.io/repos/github/eight04/rollup-plugin-inline-js/badge.svg?branch=master)](https://coveralls.io/github/eight04/rollup-plugin-inline-js?branch=master)
[![install size](https://packagephobia.now.sh/badge?p=rollup-plugin-inline-js)](https://packagephobia.now.sh/result?p=rollup-plugin-inline-js)

[Rollup](https://github.com/rollup/rollup) with [inline-js](https://www.npmjs.com/package/inline-js). This might be useful if you build the source with rollup and want to inline some static assets at build-time.

Installation
------------

```
npm install -D rollup-plugin-inline-js
```

Usage
-----

```js
import inline from "rollup-plugin-inline-js";

export default {
  input: "entry.js",
  output: {
    file: "dist/output.js",
    format: "es"
  },
  plugins: [inline()]
};
```

This plugin would replace `$inline` directives in the source, just like [inline-js](https://www.npmjs.com/package/inline-js).

Configuration
-------------

The `.inline.js` config file works as intended.

API
----

This module exports a single function.

### createPlugin

```js
const plugin = createPlugin({
  include?: Array<String>,
  exclude?: Array<String>,
  inlineOptions?: Object
});
```

Create the plugin instance.

`include` - a list of glob patterns. The plugin would only process matched files. Default to process all files.

`exclude` - a list of glob patterns. The plugin would ignore matched files. Default: `[]`.

The `inlineOptions` object would be passed to [`createInliner` function](https://github.com/eight04/inline-js-core#createinliner).

Changelog
---------

* 0.5.0 (Feb 12, 2021)

  - Bump dependencies. **Upgrade to rollup@2.38.5**.

* 0.4.0 (Jun 6, 2019)

  - Bump dependencies. **Upgrade to rollup@1.14.1.**
  - Fix: remove deprecated `dependencies` array.

* 0.3.0 (Aug 5, 2018)

  - **The plugin had been rewritten and it works in a different way.**
  - The plugin now transform the source file. So now you can write `$inline` directives in the source file just like using `inline-js` CLI.

* 0.2.1 (Jul 22, 2018)

  - Fix: exclude useless stuff in the package.

* 0.2.0 (Jul 22, 2018)

  - Update dependencies. `node.js@8.x`, `rollup@>=0.61`, `inline-js-core@0.4.x`.

* 0.1.0 (Dec 28, 2017)

  - First release.
