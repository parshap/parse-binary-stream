"use strict";

var through = require("through2");
var duplexer = require("duplexer2");

module.exports = function(callback) {
  // Defer callback. Most people expect passed callbacks to be called
  // "sometime in the future", not immediately.
  process.nextTick(function() {
    callback(read);
  });

  // State
  var pending = null;

  // Streams
  var input = through();
  var output = through();
  var ret = duplexer(input, output);
  input.on("end", output.end.bind(output));
  output.resume();
  ret.resume();
  return ret;

  function doRead(length, callback) {
    var chunk = input.read(length);
    if (chunk === null) {
      input.once("readable", function() {
        doRead(length, callback);
      });
    }
    else if (chunk.length !== length) {
      // We read the wrong number of bytes, this should only happen if
      // the stream has ended
      if (input._writableState.ending) {
        // drop the data
      }
      else {
        output.emit("error", new Error("Wrong number of bytes read"));
      }
    }
    else {
      return callback(chunk);
    }
  }

  function read(length, callback) {
    if (pending) {
      output.emit("error", new Error("Read already pending. Nest read() calls so only one read is pending at a time."));
    }
    pending = true;
    doRead(length, function(data) {
      pending = false;
      callback(data);
    });
  }
};
