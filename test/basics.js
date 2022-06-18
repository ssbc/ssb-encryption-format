// SPDX-FileCopyrightText: 2022 Andre 'Staltz' Medeiros <contact@staltz.com>
//
// SPDX-License-Identifier: CC0-1.0

const test = require('tape');
const ssbKeys = require('ssb-keys');
const Ref = require('ssb-ref');
const {check} = require('../');

test('name missing', (t) => {
  check({}, (err) => {
    t.ok(err);
    t.match(err.message, /requires the field "name" as a string/);
    t.end();
  });
});

test('suffix missing', (t) => {
  check(
    {
      name: 'cool',
    },
    (err) => {
      t.ok(err);
      t.match(err.message, /requires the field "suffix" as a string/);
      t.end();
    },
  );
});

test('encrypt missing', (t) => {
  check(
    {
      name: 'cool',
      suffix: 'cool',
    },
    (err) => {
      t.ok(err);
      t.match(err.message, /requires the function "encrypt\(\)"/);
      t.end();
    },
  );
});

test('decrypt missing', (t) => {
  check(
    {
      name: 'cool',
      suffix: 'cool',
      encrypt: () => {},
    },
    (err) => {
      t.ok(err);
      t.match(err.message, /requires the function "decrypt\(\)"/);
      t.end();
    },
  );
});

test('suffix cannot have dot', (t) => {
  check(
    {
      name: 'cool',
      suffix: '.cool',
      encrypt: () => {},
      decrypt: () => {},
    },
    (err) => {
      t.ok(err);
      t.match(err.message, /has a suffix ".cool" with a dot/);
      t.end();
    },
  );
});

test('suffix cannot have weird characters', (t) => {
  check(
    {
      name: 'cool',
      suffix: 'c#ool',
      encrypt: () => {},
      decrypt: () => {},
    },
    (err) => {
      t.ok(err);
      t.match(err.message, /has a suffix "c#ool" with invalid characters/);
      t.end();
    },
  );
});

test('encrypt() must return a buffer', (t) => {
  check(
    {
      name: 'cool',
      suffix: 'cool',
      encrypt: () => {},
      decrypt: () => {},
    },
    (err) => {
      t.ok(err);
      t.match(err.message, /encrypt\(\) function must return a buffer/);
      t.end();
    },
  );
});

test('decrypt() must return a buffer', (t) => {
  check(
    {
      name: 'cool',
      suffix: 'cool',
      encrypt: () => Buffer.from([1, 2, 3]),
      decrypt: () => {},
    },
    (err) => {
      t.ok(err);
      t.match(err.message, /decrypt\(\) function must return a buffer/);
      t.end();
    },
  );
});

test('decrypt() must return the same plaintext as encrypt() received', (t) => {
  check(
    {
      name: 'cool',
      suffix: 'cool',
      encrypt: () => Buffer.from([1, 2, 3]),
      decrypt: () => Buffer.from([9, 8, 7]),
    },
    (err) => {
      t.ok(err);
      t.match(
        err.message,
        /decrypt\(\) function must return the same plaintext as encrypt\(\) received/,
      );
      t.end();
    },
  );
});
