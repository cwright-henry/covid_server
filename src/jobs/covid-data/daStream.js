const through2 = require('through2');
const fs = require('fs');
const split = require('split2');
const https = require('https');

const CSV_ELMS = /(".*?"|[^",]+)(?=\s*,|\s*$)/g;

const parseCSV = (parseHeader, createEntry) => {
	let headers;
	let parseHeadline = true;
	return through2.obj((data, enc, cb) => {
		if (parseHeadline) {
			headers = parseHeader(data.toString().split(','));
			parseHeadline = false;
			return cb(null, null);
		}

		const entries = data.toString().match(CSV_ELMS);
		const obj = createEntry(headers, entries);
		return cb(null, obj);
	});
};

const toJSON = () => {
	let isFirst = true;
	return through2.obj((data, enc, cb) => {
		if (isFirst) {
			cb(null, '[' + JSON.stringify(data) + '\n');
			isFirst = false;
		}
		else {
			cb(null, ',' + JSON.stringify(data) + '\n');
		}
	}, (cb) => { // flush function
		cb(null, ']');
	});
}

/**
 * Make the request and pipe to backup file
 */
const makeRequest = (options) => {
	return new Promise((resolve, reject) => {
		const writeFileStream = fs.createWriteStream(options.file);

		let req = https.request(options.request, (response) => {
			response.pipe(split())
				.pipe(parseCSV(options.parseHeader, options.createEntry))
				.pipe(toJSON())
				.pipe(writeFileStream)
				.on('finish', () => {
					console.log(`Completed ${options.displayName}`)
					resolve(true)
				})
				.on('error', (error) => {
					console.log(`Error ${options.displayName}`)
					return reject(error, null);
				})
		});

		req.on('error', (error) => {
			return reject(error, null);
		});
		req.end();
	});
}

module.exports = {
	makeRequest
}