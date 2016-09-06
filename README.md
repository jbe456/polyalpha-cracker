# Polyalphabetic substitution cracker

## Summary
Only support `XOR` type for now.

Uses [Vigenère cipher](https://en.wikipedia.org/wiki/Vigenère_cipher) cracking technique:
* Uses [Friedman test](https://en.wikipedia.org/wiki/Friedman_test) with Coincidence Index (CI) to determine key length
* Uses Frequency Analysis to determine most probable key

## Usage

```
Usage: node polyalpha-cracker.js -t [type] -i [file] -s [file] [options]

Options:
  -i, --input    The input data file to decrypt  [string] [required]
  -s, --sample   The sample data to compare against crypted data  [string] [required]
  -t, --type     Type of polyalphabetical encryption to crack  [required] [choices: "xor"]
  -o, --output   The output folder for decrypted data  [string] [default: "output"]
  -l, --length   The length of the Key  [number]
  -x, --hexa     Consume the encrypted data as hexadecimal data  [boolean]
  --char-set     Char set to consider  [choices: "ascii-128", "chars-256"] [default: "ascii-128"]
  --min          The minimum key length to try out  [number] [default: 1]
  --max          The maximum key length to try out  [number] [default: 15]
  -v, --version  Show version number  [boolean]
  -h, --help     Show help  [boolean]

Examples:
  node polyalpha-cracker.js -t xor -i encrypted/xor-encrypted.js.txt -s samples/jquery-3.1.0.js
  node polyalpha-cracker.js -t xor -i encrypted/xor-encrypted.txt.hex -x -s samples/Harry_Potter_and_the_chamber_of_secrets-excerpt.txt
```

## Examples

Decrypt JavaScript ASCII text encrypted with XOR:

```
> node polyalpha-cracker.js -t xor -i encrypted/xor-encrypted.js.txt -s samples/jquery-3.1.0.js
----------
Sample Coincidence Index (CI): 4.501%
----------
CI for key length 0009: 3.498% <---
CI for key length 0015: 2.119%
CI for key length 0012: 2.022%
CI for key length 0003: 1.934%
CI for key length 0006: 1.930%
CI for key length 0011: 1.731%
CI for key length 0010: 1.541%
CI for key length 0004: 1.496%
CI for key length 0013: 1.470%
CI for key length 0008: 1.430%
CI for key length 0002: 1.413%
CI for key length 0001: 1.394%
CI for key length 0005: 1.299%
CI for key length 0014: 1.046%
CI for key length 0007: 1.042%
----------
Most probable Key Length: 9
----------
Most probable Key: Bobvi2347
----------
Decrypted data written in output/decrypted.txt
```

Decrypt English text encrypted with XOR in hexadecimal:
```
> node polyalpha-cracker.js -t xor -i encrypted/xor-encrypted.txt.hex -x -s samples/Harry_Potter_and_the_chamber_of_secrets-excerpt.txt
----------
Sample Coincidence Index (CI): 6.303%
----------
CI for key length 0005: 6.173% <---
CI for key length 0015: 6.904%
CI for key length 0010: 7.692%
CI for key length 0006: 2.752%
CI for key length 0014: 2.636%
CI for key length 0002: 2.538%
CI for key length 0012: 2.272%
CI for key length 0004: 2.150%
CI for key length 0001: 2.071%
CI for key length 0003: 2.040%
CI for key length 0007: 1.972%
CI for key length 0008: 1.770%
CI for key length 0013: 1.666%
CI for key length 0011: 1.542%
CI for key length 0009: 1.485%
----------
Most probable Key Length: 5
----------
Most probable Key: Damn!
----------
Decrypted data written in output/decrypted.txt
```

## Why?

This has been first developed to solve a CTF challenge from [ringzer0team](https://ringzer0team.com/challenges/46). See [coding-challenge](https://github.com/jbe456/coding-challenge/blob/master/RingZer0Team/JavaScript/46.md) for more details.