const fs = require('fs');
const split = require('split2');
const https = require('https');
const { parseCSV, toJSON } = require('../../utils')

const MAX_RETRIES = 5;

const parseHeader = () => {
	const dictionary = {}
	dictionary[1] = 'iso'
	dictionary[2] = 'vaccines';

	return dictionary;
}

const createEntry = (headers, entry) => {
	const dictionaryEntry = {}
	dictionaryEntry[headers['1']] = entry[1];
	dictionaryEntry[headers['2']] = entry[2].replace(/\"/g, '');

	return dictionaryEntry;
}
const VACCINE_LOCATIONS = {
	request: {
		host: 'raw.githubusercontent.com',
		path: '/owid/covid-19-data/master/public/data/vaccinations/locations.csv',
		port: 443,
		method: 'GET',
		timeout: 600000, // 10 minute timeout
		headers: {       // Fake the user agent
			'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/51.0.2704.79 Chrome/51.0.2704.79 Safari/537.36',
		},
	},
	file: './covid_data/vaccineLocations.json',
	createEntry,
	parseHeader,
	displayName: 'Vaccine Locations'
};

/**
 * Make the request and pipe to backup file
 */
const makeRequest = (options) => {
	return new Promise((resolve, reject) => {
		const writeFileStream = fs.createWriteStream(options.file);

		let req = https.request(options.request, (response) => {
			if (response.statusCode < 200 || response.statusCode > 300) {
				reject(new Error(`Invalid network response code ${response.statusCode}`));
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

/**
 * Connect to service if failed then try again for RETRIES 
 */
 const getData = async () => {
	try {
		++VACCINE_LOCATIONS.retries;
		await makeRequest(VACCINE_LOCATIONS);
		VACCINE_LOCATIONS.retries = 0;
	}
	catch (e) {
		console.log(e);
		if (VACCINE_LOCATIONS.retries < MAX_RETRIES) {
			setTimeout(() => {
				getData();
			}, 5000)
		}
		else {
			VACCINE_LOCATIONS.retries = 0;
		}
	}
}

fs.access(VACCINE_LOCATIONS.file, fs.F_OK, (err) => {
	if (err) {
		getData()
	}
})

module.exports = {
	getCovidVaccinationLocationData: getData,
	COVID_VACCINTAION_LOCATION_FILE: VACCINE_LOCATIONS.file
}