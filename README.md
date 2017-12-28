rollu-plugin-inline-js
======================

[![Build Status](https://travis-ci.org/eight04/rollup-plugin-inline-js.svg?branch=master)](https://travis-ci.org/eight04/rollup-plugin-inline-js)
[![Coverage Status](https://coveralls.io/repos/github/eight04/rollup-plugin-inline-js/badge.svg?branch=master)](https://coveralls.io/github/eight04/rollup-plugin-inline-js?branch=master)

[Rollup](https://github.com/rollup/rollup) with [inline-js](https://www.npmjs.com/package/inline-js). This might be useful if you build the source with rollup and want to import (inline) some static assets at build-time.

Installation
------------

```
npm install -D rollup-plugin-inline-js
```

Syntax
------

It is just like [defining a resource in inline-js](https://github.com/eight04/inline-js#resource), with prefix `inline-`:

*entry.js*

```js
import myCssString from "inline:style.css|cssmin";
console.log(myCssString);
```

*rollup.config.js*

```js
import inlinejs from "rollup-plugin-inline-js";

export default {
  input: "entry.js",
  plugins: [inlinejs()]
};
```

Rolluped:

```js
var myCssString = "... the minified content of style.css ...";
console.log(myCssString);
```

### Load from different resources

```js
import content from "inline:my-file"
import content from "inline-text:my-file"
import content from "inline-raw:my-file"
import content from "inline-cmd:echo hello"
```

### Transforms

```js
import content from "inline:my-file|transform:arg1,arg2|transform2"
```

Configuration
-------------

The `.inline.js` config file works as intended. There are other options to initilize the plugin. See the API section.

Stringify the content
---------------------

Since rollup is used to handle JavaScript modules, after loading the content from a resource, the content is **stringified** by `JSON.stringify` and converted into a JavaScript module:

*style.css*
```css
body {
  color: black;
}
```
*entry.js*
```js
import myCss from "inline:style.css|cssmin"
```
The module built from the content:
```js
export default "body{color:#000}";
```

You probably already noticed that with `JSON.stringify`, it can only handle promitive values, array, and plain object. However, the content returned by inline-js could be a `Buffer`, in which case, you may want to provide your own `stringify` method by passing it to the plugin:

```js
options.stringify = content => {
  if (Buffer.isBuffer(content)) {
    return `Buffer.from(${JSON.stringify(content.toString("base64"))}, "base64")`
  }
  return JSON.stringify(content);
};
```

As the result, when loading the content as buffer:

```js
export default Buffer.from("... base64 content ...", "base64");
```

API reference
-------------

This module exports a single function.

### createPlugin(options?: object) -> object

Create the plugin instance.

`options` may contains following properties:

* `stringify`: A function to stringify the content. Also see [Stringify the content](#stringify-the-content). Default: `JSON.stringify`.
* `inlineOptions`: An options object which would be passed to inline-js. Currently only one key is used:

  - `maxDepth`: Max depth of the dependency tree.

Changelog
---------

* 0.1.0 (Dec 28, 2017)

    - First release.
