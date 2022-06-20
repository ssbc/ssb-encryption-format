<!--
SPDX-FileCopyrightText: 2022 Andre 'Staltz' Medeiros <contact@staltz.com>

SPDX-License-Identifier: CC0-1.0
-->

# ssb-encryption-format

A tool that you install as a devDependency to check whether your encryption format for SSB messages is correct and ready to be installed in ssb-db2.

This tool helps you create new encryption formats that are compatible with ssb-db2 (and maybe one day other databases).

## Installation

```bash
npm install --save-dev ssb-encryption-format
```

## Usage

```js
const {check} = require('ssb-encryption-format');

const myEncryptionFormat = {
  // ...
};

// Pass your encryption format:
check(myEncryptionFormat, (err) => {
  // `err` if the format is incorrect, else it is undefined
});
```

In case your encryption format implement `setup()`, then you can also pass an `onSetup` function as an argument to `check()`. This is useful in case you need to do some extra preparation _after_ `setup()` but before `encrypt()`/`decrypt()` is run:

```js
function onSetup() {
  myEncryptionFormat.prepareSomething();
}

check(myEncryptionFormat, onSetup, (err) => {
  // ...
});
```

## Spec

An **encryption format** specifies how to encrypt and decrypt JavaScript buffers (these could be SSB messages from _any_ feed format) using a particular encryption scheme and algorithms. Every encryption format is a plugin-like object with:

- `name`
- `setup(config, cb)`
- `encrypt(plaintext, opts)`
- `decrypt(ciphertext, opts)`

## Fields and functions

Your encryption format must include these properties:

### `name`

A **string** to name this format. Try to use computer-friendly names, not human-friendly names. Avoid spaces and select short unique names.

The name will also be appended to the ciphertexts when they are base64-stringified. Do **NOT** include a dot in the name, use only lowercase alphanumeric characters.

### `setup(config, cb)`

An **OPTIONAL** function that you can use to asynchronously setup your encryption format. This function is called when the encryption format is installed in ssb-db2.

The `config` argument is the same config object that usually comes from secret-stack, and the `cb` is a function you call with zero arguments once your setup has completed.

### `encrypt(plaintext, opts)`

Takes a `plaintext` as a Buffer and `opts` object and MUST return a Buffer representing the ciphertext.

You can assume `opts` has the following properties:

- `opts.keys`: the "ssb-keys"-style cryptographic keypair object of the current SSB peer
- `opts.recps`: an array of public keys (usually strings such as sigil IDs or SSB URIs) of the recipients of the ciphertext
- `opts.previous`: a **string** representing the message ID of the previous SSB message before this plaintext

### `decrypt(ciphertext, opts)`

Takes a `ciphertext` as a Buffer and an `opts` object and MUST return a Buffer representing the plaintext.

You can assume `opts` has the following properties:

- `opts.keys`: the "ssb-keys"-style cryptographic keypair object of the current SSB peer
- `opts.previous`: a **string** representing the message ID of the previous SSB message before this plaintext
- `opts.author`: a **string** representing the feed ID who authored this ciphertext message

## License

LGPL-3.0-only
