const parseHeader = (headers) => {
	const dictionary = {}
	dictionary[0] = 'province';
	dictionary[1] = 'country';
	dictionary[2] = 'lat';
	dictionary[3] = 'lng';
	for (let i = 4; i < headers.length; i++) {
		dictionary[i] = new Date(headers[i]).getTime()
	}

	return dictionary;
}

const createEntry = (headers, entry) => {
	const dictionaryEntry = {}
	const isMatch = Object.keys(headers).length === entry.length
	dictionaryEntry[headers['0']] = isMatch ? entry[0] : '';
	dictionaryEntry[headers['1']] = isMatch ? entry[1] : entry[0];
	dictionaryEntry[headers['2']] = isMatch ? Number(entry[2]) : Number(entry[1]);
	dictionaryEntry[headers['3']] = isMatch ? Number(entry[3]) : Number(entry[2]);

	const confirmed = [];
	for (let i = 4; headers[`${i}`]; i++) {
		confirmed.push([headers[`${i}`], Number(entry[isMatch ? i : i - 1])])
	}
	dictionaryEntry['confirmed'] = confirmed;

	return dictionaryEntry;
}

module.exports = {
	confirmedGlobal: {
		request: {
			host: 'raw.githubusercontent.com',
			path: '/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv',
			port: 443,
			method: 'GET',
			timeout: 600000, // 10 minute timeout
			headers: {       // Fake the user agent
				'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/51.0.2704.79 Chrome/51.0.2704.79 Safari/537.36',
			}
		},
		file: './covid_data/confirmedGlobal.json',
		parseHeader,
		createEntry,
		displayName: 'Global Confirmed'
	}
}