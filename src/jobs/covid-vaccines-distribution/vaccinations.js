const JSONStream = require('JSONStream')
const es = require('event-stream')
const fs = require('fs');
const https = require('https');
const { toJSON } = require('../../utils')

const MAX_RETRIES = 5;

const COVID_VACCINTAIONS = {
	request: {
		host: 'raw.githubusercontent.com',
		path: '/owid/covid-19-data/master/public/data/vaccinations/vaccinations.json',
		port: 443,
		method: 'GET',
		timeout: 600000, // 10 minute timeout
		headers: {       // Fake the user agent
			'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/51.0.2704.79 Chrome/51.0.2704.79 Safari/537.36',
		}
	},
	retries: 0,
	file: './covid_data/covid_vaccinations.json',
	displayName: 'Global Vaccinations'
}

/**
 * Assumming ordered list of data
 */
const findLatest = (data, prop) => {
	let latest = 0;
	for (let i = 0; i < data.length; i++) {
		if (data[i][prop]) {
			latest = data[i][prop];
		}
	}
	return latest;
}

const createEntry = (data) => {
	const item = {
		iso: data.iso_code,
		total: findLatest(data.data, 'total_vaccinations'),
		percent: findLatest(data.data, 'people_fully_vaccinated_per_hundred') || findLatest(data.data, 'total_vaccinations_per_hundred'),
		data: []
	}
	for (const entry of data.data) {
		if (entry.daily_vaccinations || entry.people_vaccinated) {
			item.data.push([
				new Date(entry.date).getTime(),
				entry.daily_vaccinations || entry.people_vaccinated
			])
		}
	}

	return item;
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
		++COVID_VACCINTAIONS.retries;
		await makeRequest(COVID_VACCINTAIONS);
		COVID_VACCINTAIONS.retries = 0;
	}
	catch (e) {
		console.log(e);
		if (COVID_VACCINTAIONS.retries < MAX_RETRIES) {
			setTimeout(() => {
				getData();
			}, 5000)
		}
		else {
			COVID_VACCINTAIONS.retries = 0;
		}
	}
}

fs.access(COVID_VACCINTAIONS.file, fs.F_OK, (err) => {
	if (err) {
		getData()
	}
})

module.exports = {
	getCovidVaccinationData: getData,
	COVID_VACCINTAION_FILE: COVID_VACCINTAIONS.file
}