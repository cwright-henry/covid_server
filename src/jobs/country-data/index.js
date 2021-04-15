const JSONStream = require('JSONStream')
const es = require('event-stream')
const fs = require('fs');
const https = require('https');
const { toJSON } = require('../../utils')

const MAX_RETRIES = 5;

const COUNTRY_DATA = {
	request: {
		host: 'restcountries.eu',
		path: '/rest/v2/all',
		port: 443,
		method: 'GET',
		timeout: 600000, // 10 minute timeout
		headers: {       // Fake the user agent
			'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/51.0.2704.79 Chrome/51.0.2704.79 Safari/537.36',
		}
	},
	retries: 0,
	file: './covid_data/country-data.json',
	displayName: 'Country List'
}

const createEntry = ({ name, alpha2Code, alpha3Code, region, subregion, population, latlng, area, borders, flag, regionalBlocs }) => {
	return {
		name,
		alpha2Code,
		alpha3Code,
		region,
		subregion,
		population,
		latlng,
		area,
		borders,
		flag,
		regionalBlocs
	}
}

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

			response.pipe(JSONStream.parse('*'))
				.pipe(es.map(async (data, callback) => {
					callback(null, createEntry(data));
				}))
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

/**
 * Connect to service if failed then try again for RETRIES 
 */
const getData = async () => {
	try {
		++COUNTRY_DATA.retries;
		await makeRequest(COUNTRY_DATA);
		COUNTRY_DATA.retries = 0;
	}
	catch (e) {
		console.log(e);
		if (COUNTRY_DATA.retries < MAX_RETRIES) {
			setTimeout(() => {
				getData();
			}, 5000)
		}
		else {
			COUNTRY_DATA.retries = 0;
		}
	}
}

fs.access(COUNTRY_DATA.file, fs.F_OK, (err) => {
	if (err) {
		getData()
	}
})

module.exports = {
	getCountryData: getData,
	COUNTRY_FILE: COUNTRY_DATA.file
}