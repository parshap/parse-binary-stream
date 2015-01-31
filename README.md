# parse-binary-stream

[![build status](https://secure.travis-ci.org/parshap/parse-binary-stream.svg?branch=master)](http://travis-ci.org/parshap/parse-binary-stream)

Parse n-byte chunks from a binary stream.

Call `read(n, callback)` and your callback will be call when `n` bytes
of data are available from the stream. Reads can be nested to read a
series of values in order.

## Example

This example parses a binary message where the first two bytes represent
the length of the data in the following bytes.

For example, `04 16 a1` means that there are 4 bytes of data and the
data is `16 a1`.

```js
var parse = require("parse-binary-stream");

var stream = parse(function(read) {
  // Parse the length value
  read(1, function(data) {
    var length = data.readUInt8(0);
    // Parse the data of size length
    read(length, function(data) {
      console.log(data);
    });
  });
});

stream.end(new Buffer([0, 4, 1, 6, 10, 1]));
// -> logs <Buffer 16 a1>
```

### Looping Example

Sometimes you want to continuously parse messages from an indefinite
stream of data. This example parses the same protocol as above, but will
parse out as many messages possible until the stream ends.

```js
var through = require("through2");
var parse = require("parse-binary-stream");

var stream = parse(function(read) {
  (function next() {
    parseMessage(function(data) {
      console.log(data);
      next();
    });
  })();

  function parseMessage(callback) {
    // Parse the length value
    read(1, function(data) {
      var length = data.readUInt8(0);
      // Parse the data of size length
      read(length, function(data) {
        callback(data);
      });
    });
  }
});

stream.write(new Buffer([0, 2]));
stream.write(new Buffer([5]));
// logs <Buffer 05>
stream.end(new Buffer([0, 4, 1, 6, 10, 1]));
// logs <Buffer 16 a1>

```

## API

```
var parse = require("parse-binary-stream");
```

### `parse(callback)`

Creates a stream that will parse *n*-length chunks from the binary data
written to it.

The `callback` is called with a `read` function that is used to parse
chunks.

#### `read(n, callback)`

Calls the `callback` with `n` bytes of data when the data is available.
The callback may never be called if enough data never becomes available.

## Installation

```
npm install parse-binary-stream
```
