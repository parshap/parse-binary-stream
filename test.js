"use strict";

var test = require("tape");
var bufferEqual = require("buffer-equal");
var parse = require("./");

function parseMessage(read, callback) {
  // Parse the length value
  read(2, function(data) {
    var length = data.readUInt16BE(0);
    // Parse the data of size length
    read(length, function(data) {
      callback(length, data);
    });
  });
}

function loopParseMessage(read, callback) {
  (function next() {
    parseMessage(read, function() {
      callback.apply(this, arguments);
      next();
    });
  })();
}

test("parse", function(t) {
  t.plan(5);
  var ended = false;
  var stream = parse(function(read) {
    t.ok( ! ended);
    parseMessage(read, function(length, data) {
      t.ok( ! ended);
      t.equal(length, 2);
      t.ok(bufferEqual(data, new Buffer([0, 1])));
    });
  });

  stream.on("end", function() {
    ended = true;
    t.ok(true, "should end");
  });

  stream.write(new Buffer([0, 2, 0, 1]));
  stream.end();
});

test("looped", function(t) {
  var messages = [];
  var ended = false;

  var stream = parse(function(read) {
    t.ok( ! ended, "should not have ended yet");
    loopParseMessage(read, function(length, data) {
      t.ok( ! ended, "should not have ended yet");
      t.equal(length, data.length, "lengths should match");
      messages.push(data);
    });
  });

  stream.on("end", function() {
    ended = true;
    t.equal(messages.length, 2);
    t.ok(bufferEqual(messages[0], new Buffer([0, 1])));
    t.ok(bufferEqual(messages[1], new Buffer([0, 2, 4, 3])));
    t.end();
  });

  stream.write(new Buffer([0, 2, 0, 1]));
  stream.write(new Buffer([0, 4]));
  setTimeout(function() {
    stream.write(new Buffer([0, 2, 4, 3]));
    // Write some extra bytes, which should be ignore
    stream.write(new Buffer([0, 5, 2]));
    stream.end();
  }, 10);
});
