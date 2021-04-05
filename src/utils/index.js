const through2 = require('through2');

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

module.exports = {
	parseCSV,
	toJSON
}