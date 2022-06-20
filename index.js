// SPDX-FileCopyrightText: 2022 Andre 'Staltz' Medeiros <contact@staltz.com>
//
// SPDX-License-Identifier: LGPL-3.0-only

const ssbKeys = require('ssb-keys');

/** Example from the protocol guide */
const PREVIOUS = '%XphMUkWQtomKjXQvFGfsGYpt69sgEY7Y4Vou9cEuJho=.sha256';

/**
 * @typedef {Object} EncryptionFormat
 * @property {string} name
 * @property {CallableFunction=} setup
 * @property {(plaintext: Buffer, opts: Record<string, any>) => Buffer} encrypt
 * @property {(ciphertext: Buffer, opts: Record<string, any>) => Buffer} decrypt
 */

/**
 * @param {EncryptionFormat} ef
 */
function assertHasAllRequiredProps(ef) {
  if (!ef.name || typeof ef.name !== 'string') {
    // prettier-ignore
    throw new Error('Your encryption format requires the field "name" as a string');
  }

  if (!ef.encrypt || typeof ef.encrypt !== 'function') {
    // prettier-ignore
    throw new Error(`Your encryption format "${ef.name}" requires the function "encrypt()"`);
  }

  if (!ef.decrypt || typeof ef.decrypt !== 'function') {
    // prettier-ignore
    throw new Error(`Your encryption format "${ef.name}" requires the function "decrypt()"`);
  }
}

/**
 * @param {EncryptionFormat} ef
 */
function assertName(ef) {
  if (ef.name.includes('.')) {
    // prettier-ignore
    throw new Error(`Your encryption format "${ef.name}" has a name "${ef.name}" with a dot. This is not allowed.`);
  }
  if (!ef.name.match(/^[a-z0-9]+$/)) {
    // prettier-ignore
    throw new Error(`Your encryption format "${ef.name}" has a name "${ef.name}" with invalid characters. This is not allowed.`);
  }
}

/**
 * @param {EncryptionFormat} ef
 * @param {any} keys
 */
function assertEncryptReturnsBuffer(ef, keys) {
  const opts = {recps: [keys.id], keys, previous: PREVIOUS};
  const plaintext = Buffer.from('hello world', 'utf-8');
  const ciphertext = ef.encrypt(plaintext, opts);
  if (!Buffer.isBuffer(ciphertext)) {
    // prettier-ignore
    throw new Error(`Your encryption format "${ef.name}" encrypt() function must return a buffer`);
  }
}

/**
 * @param {EncryptionFormat} ef
 * @param {any} keys
 */
function assertDecryptReturnsBuffer(ef, keys) {
  const opts = {recps: [keys.id], keys, previous: PREVIOUS, author: keys.id};
  const plaintext = Buffer.from('hello world', 'utf-8');
  const ciphertext = ef.encrypt(plaintext, opts);
  const plaintext2 = ef.decrypt(ciphertext, opts);
  if (!Buffer.isBuffer(plaintext2)) {
    // prettier-ignore
    throw new Error(`Your encryption format "${ef.name}" decrypt() function must return a buffer`);
  }
}

/**
 * @param {EncryptionFormat} ef
 * @param {any} keys
 */
function assertEncryptDecrypt(ef, keys) {
  const opts = {recps: [keys.id], keys, previous: PREVIOUS, author: keys.id};
  const plaintext = Buffer.from('hello world', 'utf-8');
  const ciphertext = ef.encrypt(plaintext, opts);
  const plaintext2 = ef.decrypt(ciphertext, opts);
  if (!plaintext2.equals(plaintext)) {
    // prettier-ignore
    throw new Error(`Your encryption format "${ef.name}" decrypt() function must return the same plaintext as encrypt() received`);
  }
}

/**
 *
 * @param {EncryptionFormat} encryptionFormat
 * @param {CallableFunction} cb
 * @returns {undefined}
 */
function check(encryptionFormat, ...args) {
  const onSetup = args[1] ? args[0] : () => {}
  const cb = args[1] ? args[1] : args[0]
  const setup = encryptionFormat.setup
    ? encryptionFormat.setup.bind(encryptionFormat)
    : (config, cb2) => cb2();
  const keys = ssbKeys.generate();
  const mockConfig = {keys};
  setup(mockConfig, () => {
    if (setup) onSetup()
    try {
      assertHasAllRequiredProps(encryptionFormat);
      assertName(encryptionFormat);
      assertEncryptReturnsBuffer(encryptionFormat, keys);
      assertDecryptReturnsBuffer(encryptionFormat, keys);
      assertEncryptDecrypt(encryptionFormat, keys);
    } catch (err) {
      cb(err);
      return;
    }
    cb();
  });
}

module.exports = {
  check,
};
