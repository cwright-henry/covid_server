const parseHeader = (headers) => {
	const dictionary = {}
	dictionary[5] = 'city'
	dictionary[6] = 'province';
	dictionary[7] = 'country';
	dictionary[8] = 'lat';
	dictionary[9] = 'lng';
	for (let i = 11; i < headers.length; i++) {
		dictionary[i] = new Date(headers[i]).getTime();
	}

	return dictionary;
}

const createEntry = (headers, entry) => {
	const dictionaryEntry = {}
	dictionaryEntry[headers['5']] = entry[5];
	dictionaryEntry[headers['6']] = entry[6];
	dictionaryEntry[headers['7']] = entry[7];
	dictionaryEntry[headers['8']] = Number(entry[8]);
	dictionaryEntry[headers['9']] = Number(entry[9]);

	const confirmed = [];
	for (let i = 11; headers[`${i}`]; i++) {
		confirmed.push([headers[`${i}`], Number(entry[i])])
	}
	dictionaryEntry['confirmed'] = confirmed;

	return dictionaryEntry;
}

module.exports = {
	confirmedUS: {
		request: {
			host: 'raw.githubusercontent.com',
			path: '/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_US.csv',
			port: 443,
			method: 'GET',
			timeout: 600000, // 10 minute timeout
			headers: {       // Fake the user agent
				'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/51.0.2704.79 Chrome/51.0.2704.79 Safari/537.36',
			}
		},
		file: './covid_data/confirmedUS.json',
		createEntry,
		parseHeader,
		displayName: 'US Confirmed'
	},
}