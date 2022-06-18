// SPDX-FileCopyrightText: 2022 Andre 'Staltz' Medeiros <contact@staltz.com>
//
// SPDX-License-Identifier: LGPL-3.0-only

const ssbKeys = require('ssb-keys');

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
 */
function assertEncryptReturnsBuffer(ef) {
  const keys = ssbKeys.generate();
  const opts = {recps: [keys.id], keys};
  const plaintext = Buffer.from('hello world', 'utf-8');
  const ciphertext = ef.encrypt(plaintext, opts);
  if (!Buffer.isBuffer(ciphertext)) {
    // prettier-ignore
    throw new Error(`Your encryption format "${ef.name}" encrypt() function must return a buffer`);
  }
}

/**
 * @param {EncryptionFormat} ef
 */
function assertDecryptReturnsBuffer(ef) {
  const keys = ssbKeys.generate();
  const opts = {recps: [keys.id], keys};
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
 */
function assertEncryptDecrypt(ef) {
  const keys = ssbKeys.generate();
  const opts = {recps: [keys.id], keys: keys};
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
function check(encryptionFormat, cb) {
  const setup = encryptionFormat.setup
    ? encryptionFormat.setup.bind(encryptionFormat)
    : (config, cb2) => cb2();
  const mockConfig = {};
  setup(mockConfig, () => {
    try {
      assertHasAllRequiredProps(encryptionFormat);
      assertName(encryptionFormat);
      assertEncryptReturnsBuffer(encryptionFormat);
      assertDecryptReturnsBuffer(encryptionFormat);
      assertEncryptDecrypt(encryptionFormat);
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
