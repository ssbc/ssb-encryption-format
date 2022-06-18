// SPDX-FileCopyrightText: 2022 Andre 'Staltz' Medeiros <contact@staltz.com>
//
// SPDX-License-Identifier: CC0-1.0

const test = require('tape');
const Ref = require('ssb-ref');
const sodium = require('chloride');
const privateBox = require('private-box');
const {check} = require('../');

let setupCalled = false;

const encryptionFormat = {
  name: 'foo',

  setup(config, cb) {
    setTimeout(() => {
      setupCalled = true;
      cb();
    }, 100)
  },

  encrypt(plaintextBuf, opts) {
    const encryptionKeys = (opts.recps || opts.content.recps)
      .map(function convertToBase64DataStr(recp) {
        if (Ref.isFeed(recp)) return recp.slice(1, -8);
        else if (recp && typeof recp === 'string')
          throw new Error('foo does not support recipient ' + recp);
        else return null;
      })
      .filter((maybeBase64DataStr) => !!maybeBase64DataStr)
      .map((base64DataStr) => Buffer.from(base64DataStr, 'base64'))
      .map(sodium.crypto_sign_ed25519_pk_to_curve25519);

    return privateBox.multibox(plaintextBuf, encryptionKeys);
  },

  decrypt(ciphertextBuf, opts) {
    const secretKey =
      opts.keys._exchangeKey || // use the cache
      sodium.crypto_sign_ed25519_sk_to_curve25519(
        Buffer.from(opts.keys.private, 'base64'),
      );
    if (opts.keys.private) opts.keys._exchangeKey = secretKey; // set the cache
    return privateBox.multibox_open(ciphertextBuf, secretKey);
  },
};

test('box1 format passes the checks', (t) => {
  check(encryptionFormat, (err) => {
    t.error(err, 'no error');
    t.end();
  });
});

test('corrupted decrypt is detected', (t) => {
  const corruptedFormat = Object.create(encryptionFormat);
  corruptedFormat.decrypt = function (ciphertext) {
    return Buffer.from([12, 23, 34]);
  };

  check(corruptedFormat, (err) => {
    t.ok(err);
    t.match(
      err.message,
      /decrypt\(\) function must return the same plaintext as encrypt\(\) received/,
    );
    t.end();
  });
});

test('corrupted encrypt is detected', (t) => {
  const corruptedFormat = Object.create(encryptionFormat);
  corruptedFormat.encrypt = function (plaintext) {
    return Buffer.from([98, 87, 76]);
  };

  check(corruptedFormat, (err) => {
    t.ok(err);
    t.true(setupCalled, 'setup() was called');
    t.end();
  });
});
