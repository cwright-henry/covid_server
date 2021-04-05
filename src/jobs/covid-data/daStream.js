
const fs = require('fs');
const split = require('split2');
const https = require('https');
const {parseCSV, toJSON} = require('../../utils')

/**
 * Make the request and pipe to backup file
 */
const makeRequest = (options) => {
	return new Promise((resolve, reject) => {
		const writeFileStream = fs.createWriteStream(options.file);

		let req = https.request(options.request, (response) => {
			if (response.statusCode < 200 || response.statusCode > 300) {
				reject(new Error(`Invalid network reponse code ${response.statusCode}`));
			}

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