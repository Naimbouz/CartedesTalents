
const fs = require('fs');
const pdfLib = require('pdf-parse');
const pdf = typeof pdfLib === 'function' ? pdfLib : pdfLib.default;

console.log('Type of pdfLib:', typeof pdfLib);
console.log('Type of pdf:', typeof pdf);
console.log('pdfLib keys:', Object.keys(pdfLib));

if (typeof pdf !== 'function') {
    console.error('CRITICAL: pdf is NOT a function!');
    process.exit(1);
} else {
    console.log('SUCCESS: pdf is a function');
}
