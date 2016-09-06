#!/usr/bin/env node

const pack = require('./package.json');
const fs = require('fs');
const yargs = require('yargs');

const argv = yargs
    .usage('Usage: node $0 -t [type] -i [file] -s [file] [options]')
	.example('node $0 -t xor -i encrypted/xor-encrypted.js.txt -s samples/jquery-3.1.0.js')
	.example('node $0 -t xor -i encrypted/xor-encrypted.txt.hex -x -s samples/Harry_Potter_and_the_chamber_of_secrets-excerpt.txt')
    .option('i', {
		alias: 'input',
        demand: true,
        describe: 'The input data file to decrypt',
        type: 'string'
	})
    .option('s', {
		alias: 'sample',
        demand: true,
        describe: 'The sample data to compare against crypted data',
        type: 'string'
	})
    .option('t', {
		alias: 'type',
		demand: true,
        describe: 'Type of polyalphabetical encryption to crack',
        choices: ['xor']
	})
    .option('o', {
		alias: 'output',
		default: 'output',
        describe: 'The output folder for decrypted data',
        type: 'string'
	})
    .option('l', {
		alias: 'length',
        describe: 'The length of the Key',
        type: 'number'
	})
    .option('x', {
		alias: 'hexa',
        describe: 'Consume the encrypted data as hexadecimal data',
        type: 'boolean'
	})
    .option('char-set', {
		default: 'ascii-128',
        describe: 'Char set to consider',
        choices: ['ascii-128', 'chars-256']
	})
    .option('min', {
		default: 1,
        describe: 'The minimum key length to try out',
        type: 'number'
	})
    .option('max', {
		default: 15,
        describe: 'The maximum key length to try out',
        type: 'number'
	})
	.version(() => pack.version)
    .alias('v', 'version')
    .help()
    .alias('h', 'help')
    .argv;

const SEPARATOR = '----------';
console.log(SEPARATOR);
	
// read files
let input = fs.readFileSync(argv.i, 'utf8');
const sample = fs.readFileSync(argv.s, 'utf8');

if (argv.x) {
	function hex2ascii(hexx) {
		const hex = hexx.toString();
		let str = '';
		for (let i = 0; i < hex.length; i += 2)
			str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
		return str;
	}

	input = hex2ascii(input);
}

const charSet = argv.charSet === 'ascii-128' ? 128 : 256;

// print to percentage, with the precision given as a second argument
const toPct = (x, d=2) => `${(Math.floor(100 * Math.pow(10, d) * x) / Math.pow(10, d)).toFixed(d)}%`;

// Calculate the "square" distance between two numeric arrays of the same size
const distance = (a, b) => a.reduce((previous, elt, idx) => previous + Math.pow(elt - b[idx], 2), 0);

// build array of char count for the chars
const getCharCount = input => {
  const stat = new Array(charSet).fill(0), unit = 1;
  Array.from(input).forEach(c => stat[c.charCodeAt(0)] += unit);
  return stat;
};

const xor = (data, key) => {
  const keyCode = Array.from(key).map(x => x.charCodeAt(0));
  return Array.from(data).map((c, idx) => String.fromCharCode(c.charCodeAt(0)^keyCode[idx % key.length])).join('');
};

// compute the coincidence index (sum of all probabilities to draw twice the same letter)
// stat: ASCII array count
// size: total size of input text
const getCIFromAsciiArray = (stat, size) => stat.reduce((previousValue, count) => previousValue + (count * (count-1))/(size * (size-1)), 0);
  
const getCI = input => {
  const stat = getCharCount(input), size = input.length;
  return getCIFromAsciiArray(stat, size);
};

let keyLength = argv.l;
if (argv.l) {
	console.log(`Using Key Length: ${keyLength}`);
	console.log(SEPARATOR);
} else {
	const sampleCI = getCI(sample);
	console.log(`Sample Coincidence Index (CI): ${toPct(sampleCI, 3)}`);
	console.log(SEPARATOR);

	// calculate CI for different key length
	const cis = [];
	for(let i=argv.min; i<=argv.max; i++){
	  // initialize array of size and stat
	  const sizes = new Array(i).fill(0);
	  const stats = new Array(i).fill(0).map(x => new Array(charSet).fill(0));
	  
	  // take the encrypted text and fill up arrays
	  Array.from(input).forEach((c, idx) => {
		sizes[idx%i] += 1;
		stats[idx%i][c.charCodeAt(0)] += 1;
	  })

	  // we sum all CI and do the average
	  cis.push({ci: stats.reduce((prev, stat, idx) => prev + getCIFromAsciiArray(stat, sizes[idx]), 0)/i, length: i});
	}

	// Take the closest one to sample
	keyLength = cis.sort((a,b) => Math.abs(a.ci - sampleCI) - Math.abs(b.ci - sampleCI))[0].length;
	 
	// Print results
	cis.forEach(x => console.log(`CI for key length ${('0000' + x.length).slice(-4)}: ${toPct(x.ci, 3)} ${x.length === keyLength ? '<---' : ''}`));
	console.log(SEPARATOR);
	 
	console.log(`Most probable Key Length: ${keyLength}`);
	console.log(SEPARATOR);
}

// Calculate sample char frequencies that we will use as a base comparison
const sampleFreq = getCharCount(sample).map(c => c/sample.length);

// prepare array for each key char of possible xored values with their distance to sample
const result = new Array(keyLength).fill(0).map(x => new Array(charSet).fill(0));
for (let xored=0; xored<charSet; xored++) {
  const sizes = new Array(keyLength).fill(0);
  const charCount = new Array(keyLength).fill(0).map(x => new Array(charSet).fill(0));
  
  Array.from(input).forEach((c, idx) => {
    sizes[idx%keyLength] += 1;
    charCount[idx%keyLength][c.charCodeAt(0)^xored] += 1;
  });

  for (let k=0; k<keyLength; k++) {
    result[k][xored] = distance(charCount[k].map(x => x/sizes[k]), sampleFreq);
  }
}

// sort for each key char the closest to the sample
const output = result.map(distances => distances
  .map((distance, charCode) => ({charCode, distance}))
  .sort((a,b) => a.distance - b.distance)[0].charCode);

const key = output.map(x => String.fromCharCode(x)).join('');
console.log(`Most probable Key: ${key}`);
console.log(SEPARATOR);

// write decypher file
const dir = argv.o;
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

const file = `${dir}/decrypted.txt`;
console.log(`Decrypted data written in ${file}`);
fs.writeFileSync(file, xor(input, key));